import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { join } from 'path';

export interface MCPAnalysisResult {
  isSimilar: boolean;
  similarityScore: number;
  mostSimilarCompany?: {
    name: string;
    reason: string;
  };
  analysis?: {
    businessModelSimilarity: string;
    targetMarketOverlap: string;
    valuePropSimilarity: string;
    differentiationPotential: string;
  };
  recommendation: 'APPROVE' | 'REJECT' | 'NEEDS_DIFFERENTIATION';
  feedback: string;
  suggestions?: string[];
  error?: boolean;
  message?: string;
}

@Injectable()
export class MCPClientService {
  private readonly logger = new Logger(MCPClientService.name);
  private mcpServerPath: string;

  constructor() {
    this.mcpServerPath = join(process.cwd(), '..', 'mcp-server', 'index.js');
  }

  async analyzeIdeaSimilarity(
    userApplication: {
      title: string;
      description: string;
      targetMarket?: string;
      businessModel?: string;
    },
    ycCompanies: any[]
  ): Promise<MCPAnalysisResult> {
    try {
      this.logger.log('Starting MCP analysis for idea similarity');
      
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'analyze_idea_similarity',
          arguments: {
            userApplication,
            externalData: {
              ycCompanies
            }
          }
        }
      };

      const result = await this.callMCPServer(mcpRequest);
      
      if (result.error) {
        throw new Error(result.error.message || 'MCP analysis failed');
      }

      const analysisText = result.result?.content?.[0]?.text;
      if (!analysisText) {
        throw new Error('No analysis result from MCP server');
      }

      const analysis = JSON.parse(analysisText);
      this.logger.log(`MCP analysis completed: ${analysis.recommendation}`);
      
      return analysis;

    } catch (error) {
      this.logger.error('Error in MCP analysis:', error);
      
      // Return safe fallback
      return {
        isSimilar: false,
        similarityScore: 0,
        recommendation: 'APPROVE',
        feedback: 'Unable to complete similarity analysis. Manual review recommended.',
        error: true,
        message: error.message
      };
    }
  }

  async fetchYCCompanies(category?: string, limit?: number): Promise<any[]> {
    try {
      this.logger.log('Fetching YC companies from MCP server');
      
      // For similarity analysis, we want ALL companies - don't set any limit
      const mcpRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'fetch_yc_companies',
          arguments: {
            category,
            forSimilarityAnalysis: true, // This ensures we get all companies
            // Don't include limit for similarity analysis
            ...(limit && limit > 0 ? { limit } : {}),
          }
        }
      };

      const result = await this.callMCPServer(mcpRequest);
      
      if (result.error) {
        throw new Error(result.error.message || 'Failed to fetch YC companies');
      }

      const dataText = result.result?.content?.[0]?.text;
      if (!dataText) {
        throw new Error('No YC companies data from MCP server');
      }

      const data = JSON.parse(dataText);
      return data.companies || [];

    } catch (error) {
      this.logger.error('Error fetching YC companies:', error);
      
      // Return fallback mock data
      return [
        {
          name: "CircuitHub",
          oneLiner: "On-Demand Electronics Manufacturing",
          description: "CircuitHub offers on-demand electronics manufacturing powered by our factory-scale robotics platform, The Grid.",
          tags: ["Hard Tech", "Hardware", "Robotics"],
          industry: "Industrials"
        }
      ];
    }
  }

  private async callMCPServer(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const mcpProcess = spawn('node', [this.mcpServerPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      mcpProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`MCP server exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse the JSON-RPC response
          const lines = stdout.trim().split('\n');
          let response = null;
          
          for (const line of lines) {
            if (line.trim().startsWith('{')) {
              try {
                response = JSON.parse(line);
                break;
              } catch (e) {
                continue;
              }
            }
          }

          if (!response) {
            reject(new Error('No valid JSON response from MCP server'));
            return;
          }

          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse MCP response: ${error.message}`));
        }
      });

      mcpProcess.on('error', (error) => {
        reject(new Error(`Failed to start MCP server: ${error.message}`));
      });

      // Send the request
      mcpProcess.stdin.write(JSON.stringify(request) + '\n');
      mcpProcess.stdin.end();
    });
  }
}
