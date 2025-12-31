import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { AdminSignupDto } from './dto/create-admin.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto, LoginDto } from './dto/registerUser.dto';
import { createSuperAdminSmtpTransporter } from 'src/config/superadmin.smtp';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // async sendLoginAlertEmail(user: { email: string; name: string }) {
  //   try {
  //     // 🔍 Fetch SuperAdmin mailbox
  //     const mailbox = await this.prisma.mailbox.findUnique({
  //       where: { id: 1 }, // SuperAdmin mailbox
  //     });

  //     // 🛑 Mailbox missing or incomplete → skip safely
  //     if (!mailbox || !mailbox.email_address) {
  //       console.warn('⚠️ Login alert skipped: mailbox not configured');
  //       return;
  //     }

  //     const transporter = await createSuperAdminSmtpTransporter();

  //     // 🔐 SMTP credential validation (MOST IMPORTANT PART)
  //     try {
  //       await transporter.verify();
  //     } catch (err) {
  //       console.warn(
  //         '⚠️ Login alert skipped: SMTP credential invalid or unreachable',
  //       );
  //       return; // ❌ DO NOT THROW
  //     }

  //     // ✅ Only send mail if SMTP is verified
  //     await transporter.sendMail({
  //       from: `"Security Alert" <${mailbox.email_address}>`,
  //       to: user.email,
  //       subject: 'New Login Detected',
  //       html: `
  //       <p>Hi ${user.name},</p>
  //       <p>We noticed a new login to your account.</p>
  //       <p>If this was not you, please reset your password immediately.</p>
  //       <br/>
  //       <p>— Security Team</p>
  //     `,
  //     });
  //   } catch (err) {
  //     // 🚫 ABSOLUTELY NEVER break login
  //     console.warn('⚠️ Login alert email failed safely');
  //   }
  // }

  async generateTokens(
    user: any,
    options?: { twoFARequired?: boolean; twoFAVerified?: boolean },
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      business_id: user.business_id ?? null,

      // 🔐 2FA FLAGS (NEW, OPTIONAL)
      twoFARequired: options?.twoFARequired ?? false,
      twoFAVerified: options?.twoFAVerified ?? true,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET as string,
      expiresIn: '1d',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async hashRefreshToken(token: string) {
    return bcrypt.hash(token, 10);
  }

  // ======================================================
  // 1️⃣ ADMIN SIGNUP → BUSINESS AUTO-CREATE (UNCHANGED)
  // ======================================================
  async adminSignup(dto: AdminSignupDto) {
    const { name, email, password, companyName } = dto;

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) throw new ConflictException('Email already exists');

    const business = await this.prisma.business.create({
      data: {
        name: companyName,
        email,
        status: 'ACTIVE',
      },
    });

    const hashed = await bcrypt.hash(password, 10);
    const role = await this.ensureRole('ADMIN');

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashed,
        role_id: role.id,
        business_id: business.id,
      },
      include: { role: true },
    });

    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await this.hashRefreshToken(tokens.refreshToken) },
    });

    return {
      message: 'Admin signup successful',
      business,
      user,
      ...tokens,
    };
  }

  // ======================================================
  // 2️⃣ EMPLOYEE SIGNUP (UNCHANGED)
  // ======================================================
  async createEmployee(adminUserId: number, dto: CreateUserDto) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!admin) {
      throw new ForbiddenException('Admin authentication required');
    }

    if (!admin.business_id) {
      throw new BadRequestException(
        'Admin must belong to a business before creating employees.',
      );
    }

    // 🔥 USER LIMIT VALIDATION (ADDED)
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        business_id: admin.business_id,
        status: { in: ['TRIALING', 'ACTIVE'] },
      },
      include: { plan: true },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'No active subscription found. Please subscribe to add users.',
      );
    }

    const totalUsers = await this.prisma.user.count({
      where: {
        business_id: admin.business_id,
        role: { name: 'USER' },
      },
    });

    if (subscription.status === 'TRIALING' && totalUsers >= 5) {
      throw new ForbiddenException(
        'Trial plan allows a maximum of 5 users. Please upgrade your plan.',
      );
    }

    if (
      subscription.status === 'ACTIVE' &&
      subscription.plan.user_limit !== null &&
      subscription.plan.user_limit !== undefined &&
      totalUsers >= subscription.plan.user_limit
    ) {
      throw new ForbiddenException(
        `Your ${subscription.plan.name} plan allows a maximum of ${subscription.plan.user_limit} users.`,
      );
    }
    // 🔥 END VALIDATION

    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) throw new ConflictException('Email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    const role = await this.ensureRole('USER');

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password_hash: hashed,
        role_id: role.id,
        phone: dto.phone,
        location: dto.location,
        email_signature: dto.email_signature,
        business_id: admin.business_id,
      },
      include: { role: true },
    });

    await this.prisma.mailbox.create({
      data: {
        business_id: admin.business_id,
        user_id: user.id,
        provider: 'NONE',
        email_address: dto.email,
        is_ssl: true,
      },
    });
       
    return {
      message: 'Employee created with default mailbox',
      user,
    };
  }

  // ======================================================
  // 🔐 LOGIN (2FA ENFORCEMENT ADDED — OLD FLOW SAFE)
  // ======================================================
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // 🔐 GLOBAL 2FA POLICY
    const security = await this.prisma.securitySetting.findUnique({
      where: { id: 1 },
    });

    const is2FARequired =
      security?.force2FAForAll === true || user.twoFAEnabled === true;

    // 🔴 CASE 1: FORCED SETUP
    if (is2FARequired && !user.twoFAEnabled) {
      const tokens = await this.generateTokens(user, {
        twoFARequired: true,
        twoFAVerified: false,
      });

      return {
        message: '2FA setup required',
        require2FASetup: true,
        ...tokens,
      };
    }

    // 🟡 CASE 2: REQUIRE CODE
    if (is2FARequired && user.twoFAEnabled) {
      const tokens = await this.generateTokens(user, {
        twoFARequired: true,
        twoFAVerified: false,
      });

      return {
        message: '2FA verification required',
        require2FACode: true,
        userId: user.id,
        ...tokens,
      };
    }
    // ✅ NORMAL LOGIN (OLD BEHAVIOR)
    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await this.hashRefreshToken(tokens.refreshToken) },
    });

    /* ======================================================
   🔔 NOTIFICATION SETTING (AUTO CREATE IF NOT EXISTS)
====================================================== */
    await this.prisma.notificationSetting.upsert({
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        login_alert_enabled: true,
        email_alert_enabled: true,
      },
    });

    /* ======================================================
   🔐 LOGIN ALERT TRIGGER
====================================================== */
    // const notification = await this.prisma.notificationSetting.findUnique({
    //   where: { user_id: user.id },
    // });

    // if (notification?.login_alert_enabled) {
    //   await this.sendLoginAlertEmail({
    //     email: user.email,
    //     name: user.name,
    //   });
    // }

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        business_id: user.business_id,
      },
      ...tokens,
    };
  }

  // ======================================================
  // 🔁 REFRESH TOKENS (UNCHANGED)
  // ======================================================
  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access denied');

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await this.hashRefreshToken(tokens.refreshToken) },
    });

    return tokens;
  }

  // ======================================================
  // 🔑 CHANGE PASSWORD (UNCHANGED)
  // ======================================================
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    /* ===============================
     VERIFY CURRENT PASSWORD
  =============================== */
    const isValid = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isValid) {
      throw new UnauthorizedException('Current password incorrect');
    }

    /* ===============================
     NEW & CONFIRM PASSWORD MATCH
  =============================== */
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("Passwords don't match");
    }

    /* ===============================
     PREVENT SAME PASSWORD REUSE
  =============================== */
    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.password_hash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    /* ===============================
     STRONG PASSWORD CHECK
  =============================== */
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&])[A-Za-z\d@$!%*?#&]{8,}$/;

    if (!strongPasswordRegex.test(dto.newPassword)) {
      throw new BadRequestException(
        'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
      );
    }

    /* ===============================
     HASH & UPDATE PASSWORD
  =============================== */
    const newHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: newHash,
      },
    });

    return {
      message: 'Password updated successfully',
    };
  }

  // ======================================================
  // 🚪 LOGOUT (UNCHANGED)
  // ======================================================
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out' };
  }

  // ======================================================
  // 🔧 HELPER → ENSURE ROLE EXISTS
  // ======================================================
  private async ensureRole(name: string) {
    const role = await this.prisma.role.findUnique({ where: { name } });
    if (!role) throw new Error(`Role '${name}' not found`);
    return role;
  }

  //
  // ======================================================
  // 🔔 UPDATE NOTIFICATION SETTINGS
  // ======================================================
  async updateNotificationSettings(
    userId: number,
    dto: {
      login_alert_enabled?: boolean;
      email_alert_enabled?: boolean;
    },
  ) {
    return this.prisma.notificationSetting.upsert({
      where: { user_id: userId },
      update: {
        ...(dto.login_alert_enabled !== undefined && {
          login_alert_enabled: dto.login_alert_enabled,
        }),
        ...(dto.email_alert_enabled !== undefined && {
          email_alert_enabled: dto.email_alert_enabled,
        }),
      },
      create: {
        user_id: userId,
        login_alert_enabled: dto.login_alert_enabled ?? true,
        email_alert_enabled: dto.email_alert_enabled ?? true,
      },
    });
  }
}
