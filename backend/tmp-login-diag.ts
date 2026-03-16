import { login } from "./src/services/authService.ts";
import { generateToken } from "./src/lib/utils.ts";

const email = "codex_signup_1773639082218@example.com";
const password = "secret123";

const user = await login({ email, password });
const mockResponse = {
  cookie: (...args) => {
    console.log("cookie set", args[0]);
  },
};

const token = generateToken(user.id, mockResponse);
console.log("user", user.email);
console.log("tokenLength", token.length);