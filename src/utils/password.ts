const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const lowercase = 'abcdefghijkmnopqrstuvwxyz';
const numbers = '23456789';
const symbols = '!@#$%^&*_-+=';

const randomIndex = (max: number) => {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0] % max;
};

export const generateRandomPassword = (length = 14) => {
  if (length < 12) throw new Error('密码长度不能少于 12 位');
  const characters = [uppercase[randomIndex(uppercase.length)], lowercase[randomIndex(lowercase.length)], numbers[randomIndex(numbers.length)], symbols[randomIndex(symbols.length)]];
  const all = `${uppercase}${lowercase}${numbers}${symbols}`;
  while (characters.length < length) characters.push(all[randomIndex(all.length)]);
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1);
    [characters[index], characters[target]] = [characters[target], characters[index]];
  }
  return characters.join('');
};

export const getPasswordValidationMessage = (password: string) => {
  if (password.length < 12) return '密码至少需要 12 位';
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*_=+-]/.test(password)) return '密码需同时包含大写字母、小写字母、数字和特殊字符';
  return '';
};
