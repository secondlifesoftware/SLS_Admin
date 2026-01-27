# Resend Email Setup Guide

This guide will help you set up Resend to send invoice emails from your application.

## Why Resend?

- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Easy Integration**: Simple Python SDK
- **Reliable**: Built for developers, great deliverability
- **Modern API**: Clean, well-documented

## Setup Steps

### 1. Create a Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" (you can use GitHub, Google, or email)
3. Verify your email address

### 2. Get Your API Key

1. Once logged in, go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "SLS Admin Production")
4. Copy the API key (you'll only see it once!)

### 3. Add Domain (Optional but Recommended)

For production, you should verify your domain:

1. Go to [Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `secondlifesoftware.com`)
4. Add the DNS records they provide to your domain's DNS settings
5. Wait for verification (usually a few minutes)

**Note**: For testing, you can use Resend's test domain `onboarding@resend.dev`, but emails will be limited.

### 4. Set Environment Variables

#### For Local Development

Add to `backend/.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=invoices@secondlifesoftware.com  # Optional, defaults to invoices@secondlifesoftware.com
RESEND_FROM_NAME=Second Life Software  # Optional, defaults to "Second Life Software"
```

#### For Render (Production)

1. Go to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Add these environment variables:
   - `RESEND_API_KEY` = `re_xxxxxxxxxxxxxxxxxxxxx`
   - `RESEND_FROM_EMAIL` = `invoices@secondlifesoftware.com` (or your verified domain email)
   - `RESEND_FROM_NAME` = `Second Life Software`

### 5. Test the Integration

1. Deploy the updated backend to Render
2. Go to a client's Time Tracking tab
3. Create some time entries
4. Click "Create Invoice"
5. Check "Email invoice to client"
6. Enter the client's email
7. Click "Create & Email Invoice"

The invoice PDF will be sent as an attachment!

## Email Format

The email includes:
- Professional HTML template with your branding
- Invoice details (number, date, amount)
- PDF attachment with full invoice
- Clean, professional design

## Troubleshooting

### "Email service not configured"
- Make sure `RESEND_API_KEY` is set in your environment variables
- Restart your Render service after adding the variable

### "Failed to send email"
- Check that your API key is correct
- Verify your domain is set up (if using custom domain)
- Check Resend dashboard for error logs

### Emails going to spam
- Verify your domain with Resend
- Use a professional "from" email address
- Consider setting up SPF/DKIM records (Resend provides these)

## Free Tier Limits

- **3,000 emails/month** (free tier)
- **100 emails/day** (rate limit)
- Upgrade to paid plans for more volume

## Cost

- **Free**: 3,000 emails/month
- **Pro**: $20/month for 50,000 emails
- **Business**: Custom pricing

For most use cases, the free tier is more than enough!

## Alternative Services

If you need more emails or prefer other services:

- **SendGrid**: 100 emails/day free, then paid
- **Mailgun**: 5,000 emails/month for 3 months, then paid
- **AWS SES**: Very cheap ($0.10 per 1,000 emails), but requires AWS setup

Resend is recommended for its simplicity and developer-friendly API.
