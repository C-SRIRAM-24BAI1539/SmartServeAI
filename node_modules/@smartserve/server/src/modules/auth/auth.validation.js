
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role ?? "CUSTOMER";
  const businessName =
    typeof body.businessName === "string" ? body.businessName.trim() : "";

  if (name.length < 2 || name.length > 100) {
    return { error: "Name must contain between 2 and 100 characters." };
  }

  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8 || password.length > 72) {
    return { error: "Password must contain between 8 and 72 characters." };
  }

  if (!["CUSTOMER", "PROVIDER"].includes(role)) {
    return { error: "Role must be CUSTOMER or PROVIDER." };
  }

  if (
    role === "PROVIDER" &&
    (businessName.length < 2 || businessName.length > 120)
  ) {
    return {
      error: "Provider registration requires a business name between 2 and 120 characters.",
    };
  }

  return {
    data: {
      name,
      email,
      password,
      role,
      ...(role === "PROVIDER" ? { businessName } : {}),
    },
  };
}

export function validateLogin(body) {
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_REGEX.test(email) || email.length > 254) {
    return { error: "Enter a valid email address." };
  }

  if (!password || password.length > 72) {
    return { error: "Enter a valid password." };
  }

  return { data: { email, password } };
}