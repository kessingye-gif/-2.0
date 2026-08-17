import { getPasswordValidationMessage } from '../utils/password';

export interface AccountCredential {
  id: string;
  username: string;
  password: string;
  phone?: string;
  status: 'active' | 'inactive';
}

export const validateAccountCredentials = ({ username, password }: Pick<AccountCredential, 'username' | 'password' | 'phone'>) => {
  if (!username.trim()) return '请填写登录账号';
  if (!password) return '请设置登录密码';
  return getPasswordValidationMessage(password);
};

export const authenticateAccount = <T extends AccountCredential>(accounts: T[], username: string, password: string) =>
  accounts.find((account) => (
    account.status === 'active'
    && account.username.toLowerCase() === username.trim().toLowerCase()
    && account.password === password
  ));
