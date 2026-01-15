from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import os
from database import get_db
from models import DebtAccount, BankConnection, DebtPayment

router = APIRouter(prefix="/api/debt-tracker", tags=["debt-tracker"])

# Initialize Plaid client
plaid_client = None
try:
    if os.getenv("PLAID_CLIENT_ID") and os.getenv("PLAID_SECRET"):
        import plaid
        from plaid.api import plaid_api
        from plaid.configuration import Configuration
        from plaid.api_client import ApiClient
        
        configuration = Configuration(
            host=plaid.Environment.sandbox if os.getenv("PLAID_ENV") == "sandbox" else plaid.Environment.development,
            api_key={
                'clientId': os.getenv("PLAID_CLIENT_ID"),
                'secret': os.getenv("PLAID_SECRET")
            }
        )
        api_client = ApiClient(configuration)
        plaid_client = plaid_api.PlaidApi(api_client)
except ImportError:
    plaid_client = None
except Exception as e:
    print(f"Error initializing Plaid: {e}")
    plaid_client = None

# Initialize OpenAI for AI suggestions
openai_client = None
try:
    if os.getenv("OPENAI_API_KEY"):
        from openai import OpenAI
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except ImportError:
    openai_client = None
except Exception as e:
    print(f"Error initializing OpenAI: {e}")
    openai_client = None


# Request/Response Models
class ExchangePublicTokenRequest(BaseModel):
    public_token: str
    institution_id: str
    institution_name: str
    owner: str = "user"  # Custom owner name


class DebtAccountCreate(BaseModel):
    owner: str = "user"  # "user" or "wife"
    name: str
    account_type: str  # credit_card, loan, mortgage, line_of_credit
    institution_name: str
    original_balance: float
    current_balance: float
    interest_rate: Optional[float] = None
    minimum_payment: Optional[float] = None
    suggested_minimum_payment: Optional[float] = None
    payment_terms: Optional[str] = None
    payment_link: Optional[str] = None
    monthly_payment: Optional[float] = None
    due_date: Optional[str] = None
    plaid_account_id: Optional[str] = None


class DebtAccountUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    current_balance: Optional[float] = None
    interest_rate: Optional[float] = None
    minimum_payment: Optional[float] = None
    suggested_minimum_payment: Optional[float] = None
    payment_terms: Optional[str] = None
    payment_link: Optional[str] = None
    monthly_payment: Optional[float] = None
    due_date: Optional[str] = None


class DebtAccountResponse(BaseModel):
    id: int
    owner: str
    name: str
    account_type: str
    institution_name: str
    original_balance: float
    current_balance: float
    interest_rate: Optional[float]
    minimum_payment: Optional[float]
    suggested_minimum_payment: Optional[float]
    payment_terms: Optional[str]
    payment_link: Optional[str]
    monthly_payment: Optional[float]
    due_date: Optional[str]
    plaid_account_id: Optional[str]
    is_paid_off: bool
    paid_off_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    @classmethod
    def from_orm(cls, obj):
        """Custom conversion to handle datetime to string conversion"""
        data = {
            'id': obj.id,
            'owner': obj.owner,
            'name': obj.name,
            'account_type': obj.account_type,
            'institution_name': obj.institution_name,
            'original_balance': obj.original_balance,
            'current_balance': obj.current_balance,
            'interest_rate': obj.interest_rate,
            'minimum_payment': obj.minimum_payment,
            'suggested_minimum_payment': obj.suggested_minimum_payment,
            'payment_terms': obj.payment_terms,
            'payment_link': obj.payment_link,
            'monthly_payment': obj.monthly_payment,
            'due_date': obj.due_date.isoformat() if obj.due_date else None,
            'plaid_account_id': obj.plaid_account_id,
            'is_paid_off': obj.is_paid_off,
            'paid_off_date': obj.paid_off_date,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at
        }
        return cls(**data)

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    payment_amount: float
    payment_type: str = "manual"  # minimum, custom, manual, plaid_sync
    notes: Optional[str] = None
    payment_date: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    debt_account_id: int
    payment_amount: float
    payment_date: datetime
    payment_type: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/link-token")
def create_link_token(user_id: Optional[str] = None):
    """Create a Plaid Link token for connecting bank accounts."""
    if not plaid_client:
        raise HTTPException(
            status_code=503,
            detail="Plaid is not configured. Please add PLAID_CLIENT_ID and PLAID_SECRET to your .env file."
        )
    
    try:
        from plaid.model.link_token_create_request import LinkTokenCreateRequest
        from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
        from plaid.model.country_code import CountryCode
        from plaid.model.products import Products
        
        request_body = LinkTokenCreateRequest(
            products=[Products('transactions')],
            client_name="ClearPath Debt Tracker",
            country_codes=[CountryCode('US')],
            language='en',
            user=LinkTokenCreateRequestUser(
                client_user_id=user_id or "default_user"
            ),
            webhook='https://your-webhook-url.com'
        )
        
        response = plaid_client.link_token_create(request_body=request_body)
        return {
            "link_token": response['link_token'],
            "expiration": response['expiration']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating link token: {str(e)}")


@router.post("/exchange-public-token")
def exchange_public_token(request: ExchangePublicTokenRequest, db: Session = Depends(get_db)):
    """Exchange a public token for an access token and store the bank connection."""
    if not plaid_client:
        raise HTTPException(status_code=503, detail="Plaid is not configured.")
    
    try:
        from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
        from plaid.model.accounts_get_request import AccountsGetRequest
        
        exchange_request = ItemPublicTokenExchangeRequest(public_token=request.public_token)
        exchange_response = plaid_client.item_public_token_exchange(exchange_request)
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']
        
        bank_connection = BankConnection(
            institution_id=request.institution_id,
            institution_name=request.institution_name,
            access_token=access_token,
            item_id=item_id,
            status='active'
        )
        db.add(bank_connection)
        db.commit()
        db.refresh(bank_connection)
        
        accounts_request = AccountsGetRequest(access_token=access_token)
        accounts_response = plaid_client.accounts_get(accounts_request)
        
        debt_accounts = []
        for account in accounts_response['accounts']:
            if account['type'] in ['credit', 'loan']:
                balance = abs(account['balances']['current'])
                debt_account = DebtAccount(
                    owner=request.owner,
                    name=account['name'],
                    account_type=account['type'],
                    institution_name=request.institution_name,
                    original_balance=balance,
                    current_balance=balance,
                    plaid_account_id=account['account_id'],
                    bank_connection_id=bank_connection.id
                )
                db.add(debt_account)
                debt_accounts.append(debt_account)
        
        db.commit()
        return {
            "message": "Bank connected successfully",
            "bank_connection_id": bank_connection.id,
            "accounts_added": len(debt_accounts)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exchanging token: {str(e)}")


@router.get("/accounts", response_model=List[DebtAccountResponse])
def get_debt_accounts(
    owner: Optional[str] = None, 
    account_type: Optional[str] = None,
    include_paid_off: bool = False,
    db: Session = Depends(get_db)
):
    """Get all debt accounts, optionally filtered by owner and account type"""
    query = db.query(DebtAccount)
    
    if not include_paid_off:
        query = query.filter(DebtAccount.is_paid_off == False)
    
    if owner:
        query = query.filter(DebtAccount.owner == owner)
    
    if account_type:
        # Support filtering by category
        if account_type == "credit_cards":
            query = query.filter(DebtAccount.account_type == "credit_card")
        elif account_type == "personal_loans":
            # Personal loans are loans that aren't car or student loans
            from sqlalchemy import and_, not_, or_
            query = query.filter(
                DebtAccount.account_type == "loan",
                ~DebtAccount.name.ilike("%car%"),
                ~DebtAccount.name.ilike("%auto%"),
                ~DebtAccount.name.ilike("%vehicle%"),
                ~DebtAccount.name.ilike("%student%"),
                ~DebtAccount.name.ilike("%education%")
            )
        elif account_type == "car_loans":
            query = query.filter(
                DebtAccount.account_type == "loan",
                or_(
                    DebtAccount.name.ilike("%car%"),
                    DebtAccount.name.ilike("%auto%"),
                    DebtAccount.name.ilike("%vehicle%")
                )
            )
        elif account_type == "mortgages":
            query = query.filter(
                or_(
                    DebtAccount.account_type == "mortgage",
                    DebtAccount.name.ilike("%mortgage%"),
                    DebtAccount.name.ilike("%home loan%")
                )
            )
        elif account_type == "student_loans":
            query = query.filter(
                or_(
                    DebtAccount.account_type == "student_loan",
                    DebtAccount.name.ilike("%student%"),
                    DebtAccount.name.ilike("%education%"),
                    DebtAccount.name.ilike("%federal student%")
                )
            )
        elif account_type == "tax_debt":
            query = query.filter(
                or_(
                    DebtAccount.account_type == "tax",
                    DebtAccount.name.ilike("%tax%"),
                    DebtAccount.name.ilike("%irs%")
                )
            )
        elif account_type == "business_debt":
            query = query.filter(
                or_(
                    DebtAccount.account_type == "business",
                    DebtAccount.name.ilike("%business%"),
                    DebtAccount.name.ilike("%sba%")
                )
            )
        else:
            query = query.filter(DebtAccount.account_type == account_type)
    
    accounts = query.all()
    # Convert datetime to string for due_date
    return [
        DebtAccountResponse(
            id=acc.id,
            owner=acc.owner,
            name=acc.name,
            account_type=acc.account_type,
            institution_name=acc.institution_name,
            original_balance=acc.original_balance,
            current_balance=acc.current_balance,
            interest_rate=acc.interest_rate,
            minimum_payment=acc.minimum_payment,
            suggested_minimum_payment=acc.suggested_minimum_payment,
            payment_terms=acc.payment_terms,
            payment_link=acc.payment_link,
            monthly_payment=acc.monthly_payment,
            due_date=acc.due_date.isoformat() if acc.due_date else None,
            plaid_account_id=acc.plaid_account_id,
            is_paid_off=acc.is_paid_off,
            paid_off_date=acc.paid_off_date,
            created_at=acc.created_at,
            updated_at=acc.updated_at
        )
        for acc in accounts
    ]


@router.get("/accounts/{account_id}", response_model=DebtAccountResponse)
def get_debt_account(account_id: int, db: Session = Depends(get_db)):
    """Get a specific debt account"""
    account = db.query(DebtAccount).filter(DebtAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Debt account not found")
    return account


@router.post("/accounts", response_model=DebtAccountResponse)
def create_debt_account(account: DebtAccountCreate, db: Session = Depends(get_db)):
    """Create a new debt account (manual entry)"""
    debt_account = DebtAccount(
        owner=account.owner,
        name=account.name,
        account_type=account.account_type,
        institution_name=account.institution_name,
        original_balance=account.original_balance,
        current_balance=account.current_balance,
        interest_rate=account.interest_rate,
        minimum_payment=account.minimum_payment,
        suggested_minimum_payment=account.suggested_minimum_payment,
        payment_terms=account.payment_terms,
        payment_link=account.payment_link,
        monthly_payment=account.monthly_payment,
        due_date=datetime.fromisoformat(account.due_date) if account.due_date else None,
        plaid_account_id=account.plaid_account_id
    )
    db.add(debt_account)
    db.commit()
    db.refresh(debt_account)
    return debt_account


@router.put("/accounts/{account_id}", response_model=DebtAccountResponse)
def update_debt_account(account_id: int, account_update: DebtAccountUpdate, db: Session = Depends(get_db)):
    """Update a debt account"""
    debt_account = db.query(DebtAccount).filter(DebtAccount.id == account_id).first()
    if not debt_account:
        raise HTTPException(status_code=404, detail="Debt account not found")
    
    update_data = account_update.dict(exclude_unset=True)
    if 'due_date' in update_data and update_data['due_date']:
        update_data['due_date'] = datetime.fromisoformat(update_data['due_date'])
    
    for field, value in update_data.items():
        setattr(debt_account, field, value)
    
    db.commit()
    db.refresh(debt_account)
    return debt_account


@router.delete("/accounts/{account_id}")
def delete_debt_account(account_id: int, db: Session = Depends(get_db)):
    """Delete a debt account"""
    debt_account = db.query(DebtAccount).filter(DebtAccount.id == account_id).first()
    if not debt_account:
        raise HTTPException(status_code=404, detail="Debt account not found")
    
    db.delete(debt_account)
    db.commit()
    return {"message": "Debt account deleted successfully"}


@router.post("/accounts/{account_id}/payments", response_model=PaymentResponse)
def create_payment(account_id: int, payment: PaymentCreate, db: Session = Depends(get_db)):
    """Record a payment on a debt account"""
    debt_account = db.query(DebtAccount).filter(DebtAccount.id == account_id).first()
    if not debt_account:
        raise HTTPException(status_code=404, detail="Debt account not found")
    
    payment_date = datetime.fromisoformat(payment.payment_date) if payment.payment_date else datetime.now()
    
    # Create payment record
    debt_payment = DebtPayment(
        debt_account_id=account_id,
        payment_amount=payment.payment_amount,
        payment_type=payment.payment_type,
        payment_date=payment_date,
        notes=payment.notes
    )
    db.add(debt_payment)
    
    # Update account balance
    new_balance = max(0, debt_account.current_balance - payment.payment_amount)
    debt_account.current_balance = new_balance
    
    # Mark as paid off if balance is zero
    if new_balance == 0 and not debt_account.is_paid_off:
        debt_account.is_paid_off = True
        debt_account.paid_off_date = payment_date
    
    db.commit()
    db.refresh(debt_payment)
    return debt_payment


@router.get("/accounts/{account_id}/payments", response_model=List[PaymentResponse])
def get_account_payments(account_id: int, db: Session = Depends(get_db)):
    """Get all payments for a debt account"""
    payments = db.query(DebtPayment).filter(DebtPayment.debt_account_id == account_id).all()
    return payments


@router.post("/accounts/{account_id}/sync")
def sync_account_balance(account_id: int, db: Session = Depends(get_db)):
    """Sync account balance from Plaid"""
    account = db.query(DebtAccount).filter(DebtAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Debt account not found")
    
    if not account.plaid_account_id or not account.bank_connection:
        raise HTTPException(status_code=400, detail="Account is not connected to Plaid")
    
    if not plaid_client:
        raise HTTPException(status_code=503, detail="Plaid is not configured")
    
    try:
        from plaid.model.accounts_get_request import AccountsGetRequest
        
        accounts_request = AccountsGetRequest(access_token=account.bank_connection.access_token)
        accounts_response = plaid_client.accounts_get(accounts_request)
        
        for plaid_account in accounts_response['accounts']:
            if plaid_account['account_id'] == account.plaid_account_id:
                old_balance = account.current_balance
                new_balance = abs(plaid_account['balances']['current'])
                account.current_balance = new_balance
                
                # If balance decreased, record as payment
                if new_balance < old_balance:
                    payment_amount = old_balance - new_balance
                    payment = DebtPayment(
                        debt_account_id=account_id,
                        payment_amount=payment_amount,
                        payment_type="plaid_sync",
                        payment_date=datetime.now()
                    )
                    db.add(payment)
                
                # Check if paid off
                if new_balance == 0 and not account.is_paid_off:
                    account.is_paid_off = True
                    account.paid_off_date = datetime.now()
                
                db.commit()
                db.refresh(account)
                return {"message": "Account synced successfully", "new_balance": new_balance}
        
        raise HTTPException(status_code=404, detail="Account not found in Plaid")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing account: {str(e)}")


@router.post("/ai/suggest-payment-strategy")
def ai_suggest_payment_strategy(db: Session = Depends(get_db)):
    """Use AI to suggest which debt to pay off first and payment strategy"""
    if not openai_client:
        raise HTTPException(status_code=503, detail="OpenAI is not configured")
    
    accounts = db.query(DebtAccount).filter(DebtAccount.is_paid_off == False).all()
    if not accounts:
        return {"message": "No active debt accounts found"}
    
    # Build context for AI
    accounts_data = []
    for acc in accounts:
        accounts_data.append({
            "name": acc.name,
            "institution": acc.institution_name,
            "balance": acc.current_balance,
            "interest_rate": acc.interest_rate,
            "minimum_payment": acc.minimum_payment,
            "type": acc.account_type,
            "owner": acc.owner
        })
    
    total_debt = sum(acc.current_balance for acc in accounts)
    
    # Group debt by owner dynamically
    debt_by_owner = {}
    for acc in accounts:
        if acc.owner not in debt_by_owner:
            debt_by_owner[acc.owner] = 0
        debt_by_owner[acc.owner] += acc.current_balance
    
    # Build owner debt summary for AI prompt
    owner_debt_summary = "\n".join([f"{owner}'s Debt: ${debt:,.2f}" for owner, debt in debt_by_owner.items()])
    
    prompt = f"""You are a financial advisor helping someone pay off debt. Analyze their debt situation and provide recommendations.

Total Debt: ${total_debt:,.2f}
{owner_debt_summary}

Debt Accounts:
{chr(10).join([f"- {acc['name']} ({acc['institution']}): ${acc['balance']:,.2f} at {acc['interest_rate']}% APR, Min Payment: ${acc['minimum_payment'] or 'Unknown'}, Type: {acc['type']}, Owner: {acc['owner']}" for acc in accounts_data])}

Provide a JSON response with:
1. "priority_order": Array of account names in order of priority to pay off
2. "reasoning": Brief explanation of the strategy
3. "suggested_minimum_payments": Object with account names as keys and suggested minimum payment amounts
4. "estimated_payoff_timeline": Estimated months to pay off all debt with current strategy
5. "tips": Array of 3-5 actionable tips

Format as valid JSON only."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial advisor. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        import json
        ai_response = json.loads(response.choices[0].message.content)
        
        # Update suggested minimum payments in database
        if "suggested_minimum_payments" in ai_response:
            for account in accounts:
                if account.name in ai_response["suggested_minimum_payments"]:
                    account.suggested_minimum_payment = ai_response["suggested_minimum_payments"][account.name]
            db.commit()
        
        return ai_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting AI suggestions: {str(e)}")


@router.post("/ai/estimate-minimum-payment/{account_id}")
def ai_estimate_minimum_payment(account_id: int, db: Session = Depends(get_db)):
    """Use AI to estimate minimum payment for an account"""
    if not openai_client:
        raise HTTPException(status_code=503, detail="OpenAI is not configured")
    
    account = db.query(DebtAccount).filter(DebtAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Debt account not found")
    
    prompt = f"""Estimate the minimum monthly payment for this debt account:

Account Name: {account.name}
Institution: {account.institution_name}
Current Balance: ${account.current_balance:,.2f}
Interest Rate: {account.interest_rate or 'Unknown'}% APR
Account Type: {account.account_type}
Payment Terms: {account.payment_terms or 'Not specified'}

Based on standard practices for {account.account_type} accounts, estimate what the minimum payment would likely be. Consider:
- For credit cards: typically 1-3% of balance or $25-35 minimum
- For loans: based on amortization schedule
- For mortgages: based on principal and interest

Respond with ONLY a number (the estimated minimum payment amount). No text, just the number."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a financial calculator. Respond with only numbers."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=50
        )
        
        estimated_payment = float(response.choices[0].message.content.strip().replace('$', '').replace(',', ''))
        
        # Update the account
        account.suggested_minimum_payment = estimated_payment
        if not account.minimum_payment:
            account.minimum_payment = estimated_payment
        db.commit()
        
        return {
            "estimated_minimum_payment": estimated_payment,
            "account_id": account_id,
            "account_name": account.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error estimating minimum payment: {str(e)}")


@router.get("/summary")
def get_debt_summary(db: Session = Depends(get_db)):
    """Get comprehensive debt summary"""
    accounts = db.query(DebtAccount).filter(DebtAccount.is_paid_off == False).all()
    
    total_debt = sum(account.current_balance for account in accounts)
    total_original = sum(account.original_balance for account in accounts)
    total_paid = total_original - total_debt
    
    # Group accounts by owner dynamically
    accounts_by_owner = {}
    debt_by_owner = {}
    for acc in accounts:
        if acc.owner not in accounts_by_owner:
            accounts_by_owner[acc.owner] = []
            debt_by_owner[acc.owner] = 0
        accounts_by_owner[acc.owner].append(acc)
        debt_by_owner[acc.owner] += acc.current_balance
    
    total_minimum_payments = sum(acc.minimum_payment or 0 for acc in accounts)
    total_suggested_minimum = sum(acc.suggested_minimum_payment or acc.minimum_payment or 0 for acc in accounts)
    
    return {
        "total_debt": total_debt,
        "total_original_debt": total_original,
        "total_paid_off": total_paid,
        "debt_by_owner": debt_by_owner,  # Dynamic owner debt breakdown
        "accounts_by_owner": {owner: len(accs) for owner, accs in accounts_by_owner.items()},
        "total_minimum_payments": total_minimum_payments,
        "total_suggested_minimum_payments": total_suggested_minimum,
        "account_count": len(accounts),
        "by_institution": {
            inst: sum(acc.current_balance for acc in accounts if acc.institution_name == inst)
            for inst in set(acc.institution_name for acc in accounts)
        },
        "accounts": [
            {
                "id": acc.id,
                "name": acc.name,
                "owner": acc.owner,
                "institution": acc.institution_name,
                "balance": acc.current_balance,
                "original_balance": acc.original_balance,
                "type": acc.account_type,
                "interest_rate": acc.interest_rate,
                "minimum_payment": acc.minimum_payment,
                "suggested_minimum_payment": acc.suggested_minimum_payment
            }
            for acc in accounts
        ]
    }
