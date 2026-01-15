/**
 * Parser for Notion timeline exports
 * Parses markdown format with project info and milestone table
 */

export function parseNotionTimeline(notionText) {
  const result = {
    projectInfo: {},
    milestones: [],
    sprints: [],
    errors: []
  };

  try {
    // Extract project information
    const projectInfoMatch = notionText.match(/Project Timeline \(([^)]+)\)/);
    if (projectInfoMatch) {
      result.projectInfo.duration = projectInfoMatch[1];
    }

    const startDateMatch = notionText.match(/Start Date:\s*([^\n]+)/i);
    if (startDateMatch) {
      result.projectInfo.startDate = parseDate(startDateMatch[1].trim());
    }

    const endDateMatch = notionText.match(/End Date:\s*([^\n]+)/i);
    if (endDateMatch) {
      result.projectInfo.endDate = parseDate(endDateMatch[1].trim());
    }

    const engagementMatch = notionText.match(/Engagement:\s*([^\n]+)/i);
    if (engagementMatch) {
      result.projectInfo.engagement = engagementMatch[1].trim();
    }

    const depositMatch = notionText.match(/Deposit:\s*([^\n]+)/i);
    if (depositMatch) {
      result.projectInfo.deposit = depositMatch[1].trim();
    }

    // Extract table data
    const tableMatch = notionText.match(/\|[\s\S]*?\|/);
    if (tableMatch) {
      const tableText = notionText.substring(notionText.indexOf('|'));
      const lines = tableText.split('\n').filter(line => line.trim().startsWith('|') && !line.includes('---'));
      
      if (lines.length > 1) {
        // Parse header
        const headerLine = lines[0];
        const headers = parseTableRow(headerLine);
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
          const row = parseTableRow(lines[i]);
          if (row.length >= headers.length) {
            const milestone = {};
            headers.forEach((header, index) => {
              const value = row[index]?.trim() || '';
              const cleanHeader = header.toLowerCase().replace(/\s+/g, '_');
              
              if (cleanHeader === 'milestone') {
                milestone.milestoneNumber = value;
              } else if (cleanHeader === 'title') {
                milestone.title = value;
              } else if (cleanHeader === 'description') {
                milestone.description = value;
              } else if (cleanHeader === 'start') {
                milestone.startDate = parseDate(value);
              } else if (cleanHeader === 'end') {
                milestone.endDate = parseDate(value);
              } else if (cleanHeader === 'effort_(hrs)' || cleanHeader === 'effort') {
                milestone.effort = value;
              } else if (cleanHeader === 'acceptance_criteria') {
                milestone.acceptanceCriteria = value;
              } else if (cleanHeader === 'payment') {
                milestone.payment = value;
              } else {
                milestone[cleanHeader] = value;
              }
            });
            
            // Only add if it has a title and dates
            if (milestone.title && (milestone.startDate || milestone.endDate)) {
              result.milestones.push(milestone);
            }
          }
        }
      }
    }

    // Extract sprint information if available
    const sprintMatch = notionText.match(/\[Sprints\]\([^)]+\)/i);
    if (sprintMatch) {
      result.projectInfo.hasSprints = true;
    }

  } catch (error) {
    result.errors.push(`Parse error: ${error.message}`);
  }

  return result;
}

function parseTableRow(row) {
  // Remove leading/trailing |
  const cleaned = row.trim().replace(/^\||\|$/g, '');
  // Split by | but handle escaped pipes
  const cells = [];
  let currentCell = '';
  let inCode = false;
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '`') {
      inCode = !inCode;
      currentCell += char;
    } else if (char === '|' && !inCode) {
      cells.push(currentCell.trim());
      currentCell = '';
    } else {
      currentCell += char;
    }
  }
  if (currentCell) {
    cells.push(currentCell.trim());
  }
  
  return cells;
}

function parseDate(dateString) {
  if (!dateString || dateString.trim() === '') return null;
  
  // Try ISO format first (YYYY-MM-DD)
  const isoMatch = dateString.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) {
    const date = new Date(isoMatch[1] + 'T00:00:00');
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  // Try other common formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  return null;
}

export function convertMilestonesToTimelineEvents(milestones, clientId) {
  return milestones.map((milestone, index) => {
    const eventDate = milestone.startDate || milestone.endDate || new Date().toISOString();
    
    // Build description from milestone data, including dates and metadata
    let description = milestone.description || '';
    
    // Store milestone metadata in a structured way in description
    const metadata = [];
    if (milestone.startDate) {
      metadata.push(`Start: ${new Date(milestone.startDate).toLocaleDateString()}`);
    }
    if (milestone.endDate) {
      metadata.push(`End: ${new Date(milestone.endDate).toLocaleDateString()}`);
    }
    if (milestone.effort) {
      metadata.push(`Effort: ${milestone.effort}`);
    }
    if (milestone.acceptanceCriteria) {
      metadata.push(`Acceptance Criteria: ${milestone.acceptanceCriteria}`);
    }
    if (milestone.payment) {
      metadata.push(`Payment: ${milestone.payment}`);
    }
    
    if (metadata.length > 0) {
      description += (description ? '\n\n' : '') + metadata.join('\n');
    }
    
    // Store milestone number in next_steps for easy retrieval
    const nextSteps = milestone.acceptanceCriteria || '';
    const milestoneInfo = milestone.milestoneNumber ? `Milestone #${milestone.milestoneNumber}\n` : '';
    
    return {
      client_id: clientId,
      event_type: 'Milestone Reached',
      title: milestone.title || `Milestone ${milestone.milestoneNumber || index + 1}`,
      description: description.trim(),
      event_date: eventDate,
      next_steps: milestoneInfo + nextSteps,
      // Store additional data in description for roadmap parsing
      _milestone_data: {
        milestone_number: milestone.milestoneNumber,
        start_date: milestone.startDate,
        end_date: milestone.endDate,
        effort: milestone.effort,
        payment: milestone.payment
      }
    };
  });
}

