import crypto from 'crypto';


interface StateData {
    [key: string]: any;
    createdAt: number;
    codeVerifier?: string;
}

const stateStore = new Map<string, StateData>();
export function generateState(pkceState: Partial<StateData>): string {
  const newState = crypto.randomBytes(16).toString('hex');
  stateStore.set(newState, 
    {
        ...pkceState,
        createdAt: Date.now()
    }
  );
  return newState;
}

export function validateState(state: string): any | null {
    return stateStore.get(state) || null;
}

export function deleteState(state: string): void {   
    stateStore.delete(state);
}