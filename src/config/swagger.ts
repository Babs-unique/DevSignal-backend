import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.js';

const serverUrl = env.API_PUBLIC_URL;

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DevSignal API',
            version: '1.0.0',
            description: 'API documentation for DevSignal authentication, OAuth, resume analysis, dashboard, history, and account settings.',
        },
        servers: [
            {
                url: `${serverUrl}/api/v1`,
                description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Local development server',
            },
        ],
        tags: [
            { name: 'Auth', description: 'Email/password authentication and current-user endpoints' },
            { name: 'OAuth', description: 'Google and GitHub OAuth login endpoints' },
            { name: 'Analyses', description: 'Resume upload and AI analysis endpoints' },
            { name: 'Dashboard', description: 'Dashboard summary endpoints' },
            { name: 'History', description: 'Analysis history endpoints' },
            { name: 'Settings', description: 'Account settings endpoints' },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'accessToken',
                    description: 'HttpOnly access token cookie set by login/OAuth callbacks.',
                },
            },
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'error' },
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Something went wrong' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '665f7b7d49d2b041c8b55e91' },
                        email: { type: 'string', format: 'email', example: 'alex@devsignal.io' },
                        name: { type: 'string', example: 'Alex Developer' },
                        githubId: { type: 'string', nullable: true, example: null },
                        googleId: { type: 'string', nullable: true, example: null },
                        avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.png' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                AuthSuccess: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'success' },
                        message: { type: 'string', example: 'Login successful' },
                        data: {
                            type: 'object',
                            properties: {
                                user: { $ref: '#/components/schemas/User' },
                            },
                        },
                    },
                },
                Analysis: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: '665f7c1249d2b041c8b55e92' },
                        userId: { type: 'string', example: '665f7b7d49d2b041c8b55e91' },
                        role: { type: 'string', example: 'Frontend Engineer' },
                        score: { type: 'number', example: 82 },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    },
    apis: ['./src/docs/**/*.ts', './dist/docs/**/*.js'],
});
