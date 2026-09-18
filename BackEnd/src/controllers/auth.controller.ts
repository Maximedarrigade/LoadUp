import { Request, Response } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../lib/prisma";
import { registerSchema, loginSchema, updateProfileSchema } from "../validators/auth.validator";
import { sendEmail } from "../lib/mailer";
import { encryptDeterministic, decrypt } from "../lib/crypto";

function hashResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(req: Request, res: Response) {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { email, password, name } = parseResult.data;
    const encryptedEmail = encryptDeterministic(email);

    const existingUser = await prisma.user.findUnique({ where: { email: encryptedEmail } });
    if (existingUser) {
      return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
    }

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: { email: encryptedEmail, password: hashedPassword, name },
    });

    res.status(201).json({
      id: user.id,
      email: decrypt(user.email),
      name: user.name,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { email: encryptDeterministic(email) } });
    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides." });
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Identifiants invalides." });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, email: decrypt(user.email), name: user.name } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.userId as string;

    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.issues[0].message });
    }
    const { name, email } = parseResult.data;

    if (!name && !email) {
      return res.status(400).json({ error: "Merci de renseigner un nom ou un email." });
    }

    const data: { name?: string; email?: string } = {};
    if (name) data.name = name;

    if (email) {
      const encryptedEmail = encryptDeterministic(email);
      const existingUser = await prisma.user.findUnique({ where: { email: encryptedEmail } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: "Un compte existe déjà avec cet email." });
      }
      data.email = encryptedEmail;
    }

    const updated = await prisma.user.update({ where: { id: userId }, data });

    res.json({ id: updated.id, name: updated.name, email: decrypt(updated.email) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour du profil." });
  }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    const userId = req.userId as string;

    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: "Compte supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression du compte." });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requis." });
    }

    const user = await prisma.user.findUnique({ where: { email: encryptDeterministic(email) } });

    if (!user) {
      return res.json({
        message: "Si un compte existe avec cet email, un lien a été envoyé.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: hashResetToken(token), resetPasswordExpires: expires },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail(
      decrypt(user.email),
      "Réinitialisation de ton mot de passe LoadUp",
      `<p>Bonjour ${user.name},</p>
       <p>Clique sur ce lien pour réinitialiser ton mot de passe (valable 1 heure) :</p>
       <a href="${resetUrl}">${resetUrl}</a>
       <p>Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>`
    );

    res.json({ message: "Si un compte existe avec cet email, un lien a été envoyé." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token et nouveau mot de passe requis." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "Le mot de passe doit contenir au moins 8 caractères.",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashResetToken(token),
        resetPasswordExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: "Lien invalide ou expiré." });
    }

    const hashedPassword = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur." });
  }
}