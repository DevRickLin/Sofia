import type { NextApiRequest, NextApiResponse } from 'next';
import type { GraphResponse } from '../../../types/canvas';

// Mock knowledge graph entities with positions for visualization
const nodes = [
  { 
    id: '1', 
    type: 'entity', 
    position: { x: 100, y: 100 }, 
    data: { 
      label: 'John Doe', 
      type: 'Person', 
      properties: { age: 32, occupation: 'Developer', skills: ['JavaScript', 'React', 'Node.js'] } 
    } 
  },
  { 
    id: '2', 
    type: 'entity', 
    position: { x: 500, y: 100 }, 
    data: { 
      label: 'Jane Smith', 
      type: 'Person', 
      properties: { age: 28, occupation: 'Designer', skills: ['UI/UX', 'Figma', 'Illustration'] } 
    } 
  },
  { 
    id: '3', 
    type: 'entity', 
    position: { x: 300, y: 300 }, 
    data: { 
      label: 'Acme Corp', 
      type: 'Company', 
      properties: { industry: 'Technology', founded: 2010, employees: 150, location: 'San Francisco' } 
    } 
  },
  { 
    id: '4', 
    type: 'entity', 
    position: { x: 100, y: 500 }, 
    data: { 
      label: 'Website Redesign', 
      type: 'Project', 
      properties: { deadline: '2023-12-01', status: 'In Progress', priority: 'High', budget: '$25,000' } 
    } 
  },
  { 
    id: '5', 
    type: 'entity', 
    position: { x: 500, y: 500 }, 
    data: { 
      label: 'React', 
      type: 'Technology', 
      properties: { type: 'Frontend', category: 'JavaScript Library', version: '18.2.0' } 
    } 
  },
];

// Mock knowledge graph relationships for visualization
const edges = [
  { 
    id: '101', 
    source: '1', 
    target: '3', 
    type: 'relationship', 
    data: { 
      label: 'works at', 
      type: 'WORKS_AT', 
      properties: { since: 2019, role: 'Senior Developer', department: 'Engineering' } 
    } 
  },
  { 
    id: '102', 
    source: '2', 
    target: '3', 
    type: 'relationship', 
    data: { 
      label: 'works at', 
      type: 'WORKS_AT', 
      properties: { since: 2020, role: 'UI Designer', department: 'Design' } 
    } 
  },
  { 
    id: '103', 
    source: '1', 
    target: '4', 
    type: 'relationship', 
    data: { 
      label: 'assigned to', 
      type: 'ASSIGNED_TO', 
      properties: { role: 'Lead Developer', hours: 20 } 
    } 
  },
  { 
    id: '104', 
    source: '2', 
    target: '4', 
    type: 'relationship', 
    data: { 
      label: 'assigned to', 
      type: 'ASSIGNED_TO', 
      properties: { role: 'UI Designer', hours: 15 } 
    } 
  },
  { 
    id: '105', 
    source: '4', 
    target: '5', 
    type: 'relationship', 
    data: { 
      label: 'uses', 
      type: 'USES', 
      properties: { isCore: true } 
    } 
  },
  { 
    id: '106', 
    source: '1', 
    target: '2', 
    type: 'relationship', 
    data: { 
      label: 'collaborates with', 
      type: 'COLLABORATES_WITH', 
      properties: { projects: 3, since: 2021 } 
    } 
  },
  { 
    id: '107', 
    source: '1', 
    target: '5', 
    type: 'relationship', 
    data: { 
      label: 'skilled in', 
      type: 'SKILLED_IN', 
      properties: { level: 'Expert', years: 4 } 
    } 
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GraphResponse>
) {
  // Simulate delay
  setTimeout(() => {
    res.status(200).json({ nodes, edges });
  }, 800);
} 