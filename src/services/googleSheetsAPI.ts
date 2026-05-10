// Google Sheets API Service for KapTontine
// This service handles all communication with the Google Apps Script backend

const API_URL = 'https://script.google.com/macros/s/AKfycbyvB1zwQaXn6T6sSkVpu6qwXKU6KcP8T5F6JSZsiDIlshMLiq6IdSJ_otk9IZMz8-F1/exec';

// ============================================================================
// TYPES
// ============================================================================

export interface User {
    username: string;
    role: 'president' | 'secretary' | 'treasurer' | 'member';
    mustChangePassword: boolean;
    token: string;
}

export interface AuthResponse {
    success: boolean;
    data?: User;
    error?: string;
}

export interface Loan {
    id: string;
    member: string;
    amount: number;
    date: string;
    status: 'en_cours' | 'rembourse';
    notes: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Saving {
    id: string;
    member: string;
    amount: number;
    date: string;
    type: 'depot' | 'retrait';
    notes: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLoanDTO {
    member: string;
    amount: number;
    date: string;
    status?: 'en_cours' | 'rembourse';
    notes?: string;
}

export interface CreateSavingDTO {
    member: string;
    amount: number;
    date: string;
    type: 'depot' | 'retrait';
    notes?: string;
}

export interface UserListItem {
    username: string;
    role: string;
    email: string;
    mustChangePassword: boolean;
    lastPasswordChange: string;
}

// ============================================================================
// API HELPER
// ============================================================================

async function callAPI(action: string, params: Record<string, any> = {}): Promise<any> {
    try {
        console.log('🔄 Calling API:', action);
        console.log('📦 Params:', params);
        console.log('🌐 URL:', API_URL);

        const payload = {
            action,
            ...params,
        };

        console.log('📨 Payload:', JSON.stringify(payload));

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        console.log('✅ Response received:', response.status, response.statusText);
        console.log('📋 Response type:', response.type);
        console.log('📋 Response headers:', [...response.headers.entries()]);

        const text = await response.text();
        console.log('📄 Response text:', text);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${text}`);
        }

        const data = JSON.parse(text);
        console.log('✨ Parsed data:', data);
        return data;
    } catch (error) {
        console.error('❌ API Error:', error);

        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            if (error.message.includes('Failed to fetch')) {
                throw new Error(
                    'Impossible de se connecter au serveur Google Sheets. ' +
                    'Vérifiez que le script est bien déployé et accessible. ' +
                    'Consultez la console pour plus de détails.'
                );
            }

            if (error.message.includes('NetworkError') || error.message.includes('CORS')) {
                throw new Error(
                    'Erreur de connexion (CORS). ' +
                    'Assurez-vous que le Google Apps Script est déployé avec l\'accès "Tout le monde".'
                );
            }
        }

        throw error;
    }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export const authenticate = async (username: string, password: string): Promise<AuthResponse> => {
    return callAPI('authenticate', { username, password });
};

export const changePassword = async (
    username: string,
    oldPassword: string,
    newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('changePassword', { username, oldPassword, newPassword });
};

export const resetPassword = async (
    adminUsername: string,
    targetUsername: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('resetPassword', { adminUsername, targetUsername });
};

export const getAllUsers = async (
    username: string
): Promise<{ success: boolean; data?: UserListItem[]; error?: string }> => {
    return callAPI('getAllUsers', { username });
};

// ============================================================================
// LOANS (PRÊTS)
// ============================================================================

export const getLoans = async (): Promise<{ success: boolean; data?: Loan[]; error?: string }> => {
    return callAPI('getLoans');
};

export const createLoan = async (
    username: string,
    loan: CreateLoanDTO
): Promise<{ success: boolean; data?: Loan; error?: string }> => {
    return callAPI('createLoan', { username, ...loan });
};

export const updateLoan = async (
    username: string,
    id: string,
    loan: Partial<CreateLoanDTO>
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('updateLoan', { username, id, ...loan });
};

export const deleteLoan = async (
    username: string,
    id: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('deleteLoan', { username, id });
};

// ============================================================================
// SAVINGS (ÉPARGNES)
// ============================================================================


export const getSavings = async (username: string): Promise<{ success: boolean; data?: Saving[]; error?: string }> => {
    return callAPI('getSavings', { username });
};

export const createSaving = async (
    username: string,
    saving: CreateSavingDTO
): Promise<{ success: boolean; data?: Saving; error?: string }> => {
    return callAPI('createSaving', { username, ...saving });
};

export const updateSaving = async (
    username: string,
    id: string,
    saving: Partial<CreateSavingDTO>
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('updateSaving', { username, id, ...saving });
};

export const deleteSaving = async (
    username: string,
    id: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('deleteSaving', { username, id });
};

// ============================================================================
// SUPPORTS (SECOURS)
// ============================================================================

export interface Support {
    id: string;
    member: string;
    type: 'naissance' | 'mariage' | 'hospitalisation' | 'deces';
    amount: number;
    date: string;
    notes: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupportDTO {
    member: string;
    type: 'naissance' | 'mariage' | 'hospitalisation' | 'deces';
    amount: number;
    date: string;
    notes: string;
}

export const getSupports = async (username: string): Promise<{ success: boolean; data?: Support[]; error?: string }> => {
    return callAPI('getSupports', { username });
};

export const createSupport = async (
    username: string,
    support: CreateSupportDTO
): Promise<{ success: boolean; data?: Support; error?: string }> => {
    return callAPI('createSupport', { username, ...support });
};

export const updateSupport = async (
    username: string,
    id: string,
    support: Partial<CreateSupportDTO>
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('updateSupport', { username, id, ...support });
};

export const deleteSupport = async (
    username: string,
    id: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
    return callAPI('deleteSupport', { username, id });
};
