import axios from 'axios';
import { githubConfig } from '../config/github.js';

export const githubAccessToken = async (code: string, codeVerifier: string) => {
    if (!code) {
        throw new Error('Authorization code is required');
    }
    if (!codeVerifier) {
        throw new Error('Code verifier is required');
    }

    try{
        const response = await axios.post(
            githubConfig.tokenUrl,
            {
                client_id: githubConfig.clientId,
                client_secret: githubConfig.clientSecret,
                code: code,
                redirect_uri: githubConfig.redirectUri,
                code_verifier: codeVerifier
            },
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'Accept': 'application/json'
                }
            }
        );
        if(response.data.error){
            throw new Error(`GitHub token exchange error: ${response.data.error_description || response.data.error}`);
        }
        if (response.data.access_token) {
            return response.data.access_token;
        } else {
            throw new Error('Failed to exchange code for access token');
        }


    }catch(e){
        console.error('Error exchanging code for access token:', e);
        throw new Error('Failed to exchange code for access token');
    }
    
}


export const githubUser = async (accessToken: string) => {
    if (!accessToken) {
        throw new Error('Access token is required');
    }
    try{
        const response = await axios.get(githubConfig.apiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`, 
                'Accept': 'application/json'
            }
        });
        const githubUserData = response.data;
        if (!githubUserData || !githubUserData.id) {
            throw new Error('Invalid GitHub user data received');
        }
        if (!githubUserData.email) {
            try{
            const emailsResponse = await axios.get(`${githubConfig.apiUrl}/emails`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });
            const primaryEmail = emailsResponse.data.find((email: any) => email.primary && email.verified);
            githubUserData.email = primaryEmail ? primaryEmail.email : null;
        }catch(e){
            console.warn('Could not fetch user emails from GitHub:', e);
            githubUserData.email = null;
        }
    }
        return githubUserData;
    } catch (error) {
        console.error('Error fetching GitHub user data:', error);
        throw new Error('Failed to fetch GitHub user data');
    }
}
