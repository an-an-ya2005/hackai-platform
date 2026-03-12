# AI Review Service

This is the AI-powered application review microservice for the hackathon platform. It automatically evaluates submitted applications through multiple review stages.

## Features

### Automated Review Pipeline

The AI service processes applications through the following stages:

1. **External Idea Review** - Checks if the idea already exists on platforms like Product Hunt and Y Combinator
2. **Internal Idea Review** - Compares with other submitted applications to avoid duplicates
3. **Categorization** - Automatically classifies applications into relevant categories
4. **Implementation Feasibility** - Reviews technical feasibility and implementation complexity
5. **Cost Analysis** - Evaluates if the requested budget is sufficient for implementation
6. **Customer Impact Review** - Assesses market potential and business viability

### Review States

Applications move through these states during AI review:
- `SUBMITTED` → `EXTERNAL_IDEA_REVIEW` → `INTERNAL_IDEA_REVIEW` → `CATEGORIZATION` → `IMPLEMENTATION_REVIEW` → `COST_REVIEW` → `IMPACT_REVIEW` → `UNDER_REVIEW` (manual review) or `REJECTED`

## Architecture

- **Microservice Design**: Runs independently from the main backend
- **TCP Communication**: Uses NestJS microservices for inter-service communication
- **Database Integration**: Shares the same database as the main application
- **Asynchronous Processing**: Reviews are processed in the background

## API Endpoints

### HTTP Endpoints (for testing)
- `POST /ai-review/process/:applicationId` - Manually trigger review process
- `GET /ai-review/status/:applicationId` - Get review status and progress
- `GET /ai-review/report/:applicationId` - Get detailed review report
- `POST /ai-review/retry/:applicationId/:reviewType` - Retry a failed review step
- `GET /ai-review/health` - Health check

### Microservice Patterns
- `process_application_review` - Triggered when application is submitted
- `get_review_status` - Get current review status
- `retry_review` - Retry a specific review step

## Environment Variables

```env
DATABASE_URL=postgresql://...
PORT=3002
NODE_ENV=development
```

## Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Start the service:
```bash
npm run start:dev
```

The AI service will run on port 3002 (HTTP) and 3003 (microservice).

## Integration with Backend

The main backend automatically triggers AI reviews when applications are submitted:

1. User submits application → Backend updates status to `SUBMITTED`
2. Backend sends message to AI service via TCP microservice
3. AI service processes application through review pipeline
4. Each stage updates application status and creates AI review records
5. Final result is either `UNDER_REVIEW` (for manual review) or `REJECTED`

## Review Logic

### External Idea Review
- Simulates checking Product Hunt, Y Combinator, and web search
- Rejects applications with >70% similarity to existing products

### Internal Idea Review
- Compares with other applications in the database
- Uses text similarity algorithms (Jaccard similarity, Levenshtein distance)
- Rejects applications with >80% similarity to existing submissions

### Categorization
- Analyzes application content using keyword matching
- Assigns categories like E-Commerce, Healthcare, Education, etc.
- Uses confidence scoring for category assignment

### Implementation Feasibility
- Evaluates technical complexity based on tech stack and description
- Assesses team capability based on team size and experience
- Considers timeframe and resource requirements
- Rejects if overall feasibility score < 60%

### Cost Analysis
- Estimates development, infrastructure, third-party, and operational costs
- Compares with requested budget
- Rejects if budget is insufficient (>20% shortfall)

### Customer Impact Review
- Analyzes problem severity and market size
- Evaluates solution novelty and business viability
- Assesses user experience potential
- Rejects if overall impact score < 60%

## Monitoring

- All review stages are logged with detailed information
- Review metadata is stored in the database for analysis
- Failed reviews include error messages for debugging

## Future Enhancements

- Integration with real external APIs (Product Hunt, Y Combinator)
- Machine learning models for better text analysis
- Sentiment analysis for application quality assessment
- Real-time progress notifications
- A/B testing for review criteria optimization
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
