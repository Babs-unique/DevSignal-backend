import axios from 'axios';
import { googleConfig } from '../config/google.js';
import e from 'express';



export const googleAccessToken = async (code: string, codeVerifier: string) => {
    if (!code) {
        throw new Error('Authorization code is required');
    }
    if (!codeVerifier) {
        throw new Error('Code verifier is required');
    }
    try{
        const response = await axios.post(
            googleConfig.tokenUrl,
            {
                client_id: googleConfig.clientId,
                client_secret: googleConfig.clientSecret,
                code: code,
                redirect_uri: googleConfig.redirectUri,
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
            throw new Error(`Google token exchange error: ${response.data.error_description || response.data.error}`);
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


export const googleUser = async (accessToken: string) => {
    if (!accessToken) {
        throw new Error('Access token is required');
    }
    try{
        const response = await axios.get(googleConfig.apiUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });
        const googleUserData = response.data;
        if (!googleUserData || !googleUserData.sub) {
            throw new Error('Failed to fetch Google user data');
        }
        if(!googleUserData.email){
            try {
                const emailResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo?alt=json', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`, 
                        Accept: 'application/json'
                    }
                });
                const emailData = emailResponse.data;
                googleUserData.email = emailData ? emailData.email : null;
            } catch (e) {
                console.error('Error fetching Google user email:', e);
                throw new Error('Failed to fetch Google user email');
            }
        }
    }catch(e){
        console.error('Error fetching Google user data:', e);
        throw new Error('Failed to fetch Google user data');
    }
}