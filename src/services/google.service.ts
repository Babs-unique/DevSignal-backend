import axios from 'axios';
import { googleConfig } from '../config/google.js'


export const googleAccessToken = async (code: string, codeVerifier: string) => {
    if (!code) {
        throw new Error('Authorization code is required');
    }
    if (!codeVerifier) {
        throw new Error('Code verifier is required');
    }
    try{
        const tokenPayload = new URLSearchParams({
            client_id: googleConfig.clientId,
            client_secret: googleConfig.clientSecret,
            code,
            code_verifier: codeVerifier,
            grant_type: 'authorization_code',
            redirect_uri: googleConfig.redirectUri,
        });

        const response = await axios.post(
            googleConfig.tokenUrl,
            tokenPayload,
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

    }catch(error){
        if (axios.isAxiosError(error)) {
            console.error('Google token exchange failed:', error.response?.data || error.message);
            throw new Error(`Failed to exchange code for access token: ${error.response?.data?.error_description || error.response?.data?.error || error.message}`);
        }

        console.error('Error exchanging code for access token:', error);
        throw error;
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

        return googleUserData;
    }catch(error){
        console.error('Error fetching Google user data:', error);
        throw new Error('Failed to fetch Google user data');
    }
}
