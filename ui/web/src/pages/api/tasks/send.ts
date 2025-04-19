import type { NextApiRequest, NextApiResponse } from 'next';
import type { TaskRequest, TaskResponse, Message, Artifact } from '../../../types/chat';
import { v4 as uuidv4 } from 'uuid';

// Mock knowledge graph entities
const knowledgeEntities = [
  { id: '1', type: 'Person', label: 'John Doe', properties: { age: 32, occupation: 'Developer' } },
  { id: '2', type: 'Person', label: 'Jane Smith', properties: { age: 28, occupation: 'Designer' } },
  { id: '3', type: 'Company', label: 'Acme Corp', properties: { industry: 'Technology', founded: 2010 } },
  { id: '4', type: 'Project', label: 'Website Redesign', properties: { deadline: '2023-12-01', status: 'In Progress' } },
  { id: '5', type: 'Technology', label: 'React', properties: { type: 'Frontend', category: 'JavaScript Library' } },
];

// Mock knowledge graph relationships
const knowledgeRelationships = [
  { id: '101', source: '1', target: '3', type: 'WORKS_AT', label: 'works at', properties: { since: 2019 } },
  { id: '102', source: '2', target: '3', type: 'WORKS_AT', label: 'works at', properties: { since: 2020 } },
  { id: '103', source: '1', target: '4', type: 'ASSIGNED_TO', label: 'assigned to', properties: { role: 'Lead Developer' } },
  { id: '104', source: '2', target: '4', type: 'ASSIGNED_TO', label: 'assigned to', properties: { role: 'UI Designer' } },
  { id: '105', source: '4', target: '5', type: 'USES', label: 'uses', properties: {} },
  { id: '106', source: '1', target: '2', type: 'COLLABORATES_WITH', label: 'collaborates with', properties: { projects: 3 } },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TaskResponse>
) {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    const { taskId, message } = req.body as TaskRequest;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get user's message content
    const userMessageContent = message.parts.find(part => part.type === 'text')?.content || '';
    
    // Build response message with some logic based on the user's message
    let responseMessage: Message;
    const artifacts: Artifact[] = [];
    
    if (userMessageContent.toLowerCase().includes('who') || userMessageContent.toLowerCase().includes('person')) {
      // Query about people
      const people = knowledgeEntities.filter(entity => entity.type === 'Person');
      
      responseMessage = {
        role: 'agent',
        parts: [{
          type: 'text',
          content: `I found ${people.length} people in the knowledge graph:\n\n${people.map(p => `- ${p.label} (${p.properties.occupation}, ${p.properties.age} years old)`).join('\n')}`
        }],
        timestamp: new Date().toISOString()
      };
      
      // Add artifact with the people data
      artifacts.push({
        id: uuidv4(),
        parts: [{
          type: 'data',
          mimeType: 'application/json',
          data: people
        }]
      });
    } 
    else if (userMessageContent.toLowerCase().includes('relationship') || userMessageContent.toLowerCase().includes('connection')) {
      // Query about relationships
      responseMessage = {
        role: 'agent',
        parts: [{
          type: 'text',
          content: `Here are the relationships in the knowledge graph:\n\n${knowledgeRelationships.map(rel => {
              const source = knowledgeEntities.find(e => e.id === rel.source)?.label || rel.source;
              const target = knowledgeEntities.find(e => e.id === rel.target)?.label || rel.target;
              return `- ${source} ${rel.label} ${target}`;
            }).join('\n')}`
        }],
        timestamp: new Date().toISOString()
      };
      
      // Add artifact with the relationship data
      artifacts.push({
        id: uuidv4(),
        parts: [{
          type: 'data',
          mimeType: 'application/json',
          data: knowledgeRelationships.map(rel => ({
            ...rel,
            sourceName: knowledgeEntities.find(e => e.id === rel.source)?.label,
            targetName: knowledgeEntities.find(e => e.id === rel.target)?.label,
          }))
        }]
      });
    }
    else if (userMessageContent.toLowerCase().includes('project')) {
      // Query about projects
      const projects = knowledgeEntities.filter(entity => entity.type === 'Project');
      const projectRelationships = knowledgeRelationships.filter(rel => 
        projects.some(p => p.id === rel.source || p.id === rel.target)
      );
      
      responseMessage = {
        role: 'agent',
        parts: [{
          type: 'text',
          content: `I found information about projects:\n\n${
            projects.map(p => {
              const team = knowledgeRelationships
                .filter(rel => rel.target === p.id)
                .map(rel => {
                  const person = knowledgeEntities.find(e => e.id === rel.source);
                  return `${person?.label} (${rel.properties.role})`;
                })
                .join(', ');
                
              return `- ${p.label} (Status: ${p.properties.status})${team ? `\n  Team: ${team}` : ''}`;
            }).join('\n\n')
          }`
        }],
        timestamp: new Date().toISOString()
      };
    }
    else {
      // General response
      responseMessage = {
        role: 'agent',
        parts: [{
          type: 'text',
          content: `I'm your knowledge graph assistant. You can ask about:\n\n- People in the organization\n- Projects and their status\n- Relationships between entities\n\nWhat would you like to know about the knowledge graph?`
        }],
        timestamp: new Date().toISOString()
      };
    }
    
    // Create full task response
    const taskResponse: TaskResponse = {
      taskId,
      status: 'completed',
      messages: [
        // Include the original user message
        {
          role: 'user',
          parts: message.parts,
          timestamp: new Date().toISOString()
        },
        // Include the agent response
        responseMessage
      ],
      artifacts
    };
    
    res.status(200).json(taskResponse);
  } catch (error) {
    console.error('Error processing task:', error);
    
    res.status(500).json({
      taskId: req.body?.taskId || '',
      status: 'failed',
      messages: [],
      artifacts: []
    });
  }
} 