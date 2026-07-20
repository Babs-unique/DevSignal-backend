/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new email/password user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, confirmPassword, token]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alex@devsignal.io
 *               password:
 *                 type: string
 *                 example: Password123
 *               confirmPassword:
 *                 type: string
 *                 example: Password123
 *               token:
 *                 type: string
 *                 description: Cloudflare Turnstile token
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       400:
 *         description: Invalid input or duplicate email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Sets HttpOnly accessToken and refreshToken cookies when login succeeds.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, token]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alex@devsignal.io
 *               password:
 *                 type: string
 *                 example: Password123
 *               token:
 *                 type: string
 *                 description: Cloudflare Turnstile token
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccess'
 *       400:
 *         description: Invalid credentials or validation error
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access and refresh token cookies
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid or expired refresh token
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout the current user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: User is not authenticated
 *
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: User is not authenticated
 *
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alex@devsignal.io
 *     responses:
 *       200:
 *         description: Reset email response
 *
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset a password using a reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *
 * /auth/github:
 *   get:
 *     tags: [OAuth]
 *     summary: Start GitHub OAuth
 *     parameters:
 *       - in: query
 *         name: json
 *         schema:
 *           type: string
 *           enum: ['true']
 *         description: Return the authorization URL as JSON instead of redirecting.
 *     responses:
 *       200:
 *         description: GitHub authorization URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 authUrl:
 *                   type: string
 *                   example: https://github.com/login/oauth/authorize?client_id=...
 *       302:
 *         description: Redirects to GitHub when json=true is not provided
 *
 * /auth/github/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: GitHub OAuth callback
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Sets cookies and redirects to frontend callback page
 *       400:
 *         description: Missing or invalid callback parameters
 *
 * /auth/google:
 *   get:
 *     tags: [OAuth]
 *     summary: Start Google OAuth
 *     parameters:
 *       - in: query
 *         name: json
 *         schema:
 *           type: string
 *           enum: ['true']
 *         description: Return the authorization URL as JSON instead of redirecting.
 *     responses:
 *       200:
 *         description: Google authorization URL
 *       302:
 *         description: Redirects to Google when json=true is not provided
 *
 * /auth/google/callback:
 *   get:
 *     tags: [OAuth]
 *     summary: Google OAuth callback
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Sets cookies and redirects to frontend callback page
 *       400:
 *         description: Missing or invalid callback parameters
 *
 * /analyses:
 *   post:
 *     tags: [Analyses]
 *     summary: Upload a resume and create a new analysis
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [resume]
 *             properties:
 *               resume:
 *                 type: string
 *                 format: binary
 *               targetRole:
 *                 type: string
 *                 example: Frontend Engineer
 *               jobDescription:
 *                 type: string
 *     responses:
 *       201:
 *         description: Analysis created
 *       401:
 *         description: User is not authenticated
 *
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: User is not authenticated
 *
 * /dashboard/latest/{id}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get latest analyses by user id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Latest analyses
 *
 * /history:
 *   get:
 *     tags: [History]
 *     summary: Get authenticated user's analysis history
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Analysis history list
 *
 * /history/metric:
 *   get:
 *     tags: [History]
 *     summary: Get history metrics
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: History metrics
 *
 * /history/search:
 *   get:
 *     tags: [History]
 *     summary: Search analysis history
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: Matching history records
 *
 * /history/{id}:
 *   get:
 *     tags: [History]
 *     summary: Get one history item by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: History item
 *       404:
 *         description: History item not found
 *   delete:
 *     tags: [History]
 *     summary: Delete one history item by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: History item deleted
 * 
 * /history/{id}/duplicate:
 *   post:
 *     tags: [History]
 *     summary: Duplicate history item by id
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: History duplicated successfully
 *
 * /settings:
 *   get:
 *     tags: [Settings]
 *     summary: Get account settings
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account settings
 *   delete:
 *     tags: [Settings]
 *     summary: Delete the authenticated user's account
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *
 * /settings/password:
 *   patch:
 *     tags: [Settings]
 *     summary: Update account password
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated
 *
 * /settings/export:
 *   get:
 *     tags: [Settings]
 *     summary: Export the authenticated user's account data
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Exported account data
 */
export {};
