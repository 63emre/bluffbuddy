/**
 * ==========================================================
 * APP CONTROLLER (Health & Root)
 * ==========================================================
 * BluffBuddy Online - Root API Endpoints
 *
 * @owner DEV1 (Infrastructure)
 * @version v0.2.0
 *
 * ENDPOINTS:
 * - GET / - API Info
 * - GET /health - Health check
 * - GET /health/ready - Readiness probe
 * - GET /health/live - Liveness probe
 * ==========================================================
 */

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AppService } from './app.service';

/**
 * Health Check Response DTO
 */
class HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    redis: 'up' | 'down';
    firestore: 'up' | 'down';
  };
}

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiExcludeEndpoint()
  getApiInfo() {
    return {
      name: 'BluffBuddy Online API',
      version: '0.2.0',
      docs: '/docs',
      health: '/health',
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns the overall health status of the API and its dependencies.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    type: HealthCheckResponse,
  })
  @ApiResponse({
    status: 503,
    description: 'Service is unhealthy',
  })
  getHealth(): HealthCheckResponse {
    // TODO: Implement actual health checks
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.2.0',
      uptime: process.uptime(),
      services: {
        redis: 'up',
        firestore: 'up',
      },
    };
  }

  @Get('health/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Kubernetes readiness probe. Returns 200 when ready to accept traffic.',
  })
  @ApiResponse({ status: 200, description: 'Ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Not ready' })
  getReadiness() {
    // TODO: Check if all dependencies are ready
    return { ready: true };
  }

  @Get('health/live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Kubernetes liveness probe. Returns 200 if the process is alive.',
  })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  getLiveness() {
    return { alive: true };
  }
}
