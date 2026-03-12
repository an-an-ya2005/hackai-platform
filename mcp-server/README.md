# External & Internal Review MCP Server

This Model Context Protocol (MCP) server provides startup idea review functionality for both external (Y Combinator companies) and internal (user applications in database) similarity analysis.

## Features

### External Review (Y Combinator)
- Fetch Y Combinator companies from official API
- Analyze similarity against YC portfolio companies
- AI-powered analysis using Gemini AI
- Fallback analysis when AI is unavailable

### Internal Review (Database)
- Fetch user applications from internal database
- Analyze similarity against other user submissions
- Compare problem statements, solutions, and tech stacks
- Account for application status and user context

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Generate Prisma client:
```bash
npx prisma generate
```

## Environment Variables

```bash
# Optional: Gemini AI API Key for enhanced analysis
GEMINI_API_KEY=your-gemini-api-key-here

# Required: Database connection for internal review
DATABASE_URL=postgresql://username:password@localhost:5432/ai_hackathon
```

## Available Tools

### 1. `fetch_yc_companies`
Fetches Y Combinator companies for external comparison.

**Parameters:**
- `category` (optional): Filter by industry category
- `limit` (optional): Limit number of results
- `includeInactive` (optional): Include inactive companies
- `forSimilarityAnalysis` (optional): Return all companies for analysis

### 2. `analyze_idea_similarity`
Analyzes similarity against Y Combinator companies.

**Parameters:**
- `userApplication`: Object with title, description, problemStatement, proposedSolution
- `externalData`: Object with ycCompanies array

### 3. `fetch_internal_applications`
Fetches user applications from the database for internal comparison.

**Parameters:**
- `excludeUserId` (required): Current user ID to exclude from results
- `status` (optional): Filter by application status
- `limit` (optional): Limit number of results
- `includeInactive` (optional): Include inactive applications
- `forSimilarityAnalysis` (optional): Return all applications for analysis

### 4. `analyze_internal_idea_similarity`
Analyzes similarity against internal user applications.

**Parameters:**
- `userApplication`: Object with title, description, problemStatement, proposedSolution, techStack, teamSize, currentUserId
- `internalData`: Object with applications array

## Usage Examples

### External Review Workflow
```javascript
// 1. Fetch Y Combinator companies
const ycData = await mcpServer.fetchYCCompanies({
  forSimilarityAnalysis: true
});

// 2. Analyze similarity
const externalResult = await mcpServer.analyzeIdeaSimilarity({
  userApplication: {
    title: "AI Fraud Detection",
    description: "ML-powered fraud detection for e-commerce",
    problemStatement: "E-commerce platforms lose billions to fraud",
    proposedSolution: "Real-time ML analysis of transaction patterns"
  },
  externalData: ycData
});
```

### Internal Review Workflow
```javascript
// 1. Fetch internal applications (excluding current user)
const internalData = await mcpServer.fetchInternalApplications({
  excludeUserId: "current-user-id",
  forSimilarityAnalysis: true
});

// 2. Analyze similarity
const internalResult = await mcpServer.analyzeInternalIdeaSimilarity({
  userApplication: {
    title: "AI Fraud Detection",
    description: "ML-powered fraud detection for e-commerce",
    problemStatement: "E-commerce platforms lose billions to fraud",
    proposedSolution: "Real-time ML analysis of transaction patterns",
    techStack: ["Python", "TensorFlow", "React"],
    teamSize: 4,
    currentUserId: "current-user-id"
  },
  internalData: internalData
});
```

## Analysis Results

Both external and internal analysis return structured JSON with:

```json
{
  "isSimilar": boolean,
  "similarityScore": number,
  "mostSimilarApplication": {
    "id": "string",
    "title": "string", 
    "reason": "string"
  },
  "analysis": {
    "titleSimilarity": "string",
    "problemSimilarity": "string",
    "solutionSimilarity": "string",
    "techStackSimilarity": "string"
  },
  "recommendation": "APPROVE" | "REJECT",
  "feedback": "string",
  "suggestions": ["array of strings"]
}
```

## Testing

Run the test script to verify functionality:

```bash
node test-internal-review.js
```

## Architecture

### Similarity Analysis Algorithm

1. **Name Similarity**: String similarity using Levenshtein distance
2. **Problem Analysis**: Business concept similarity using keyword matching
3. **Solution Comparison**: Technology and approach similarity
4. **Tech Stack Analysis**: Framework and language overlap
5. **Status Weighting**: Prioritize active/accepted applications

### Thresholds

- **External Review**: 40% similarity threshold for rejection
- **Internal Review**: 50% similarity threshold for rejection (stricter)
- **Name + Problem**: Lower thresholds for exact name matches

### Fallback System

When Gemini AI is unavailable:
- Uses rule-based similarity analysis
- Maintains same decision criteria
- Provides detailed reasoning
- No degradation in accuracy

## Development

Start the MCP server:
```bash
npm start
```

Development mode with auto-reload:
```bash
npm run dev
```

## Integration

This MCP server integrates with:
- AI/Backend service for automated reviews
- Frontend application submission flow
- Database for application management
- Notification system for status updates
