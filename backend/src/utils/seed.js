const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');
const Subscription = require('../models/Subscription');
const AuditLog = require('../models/AuditLog');
const Project = require('../models/Project');
const Invitation = require('../models/Invitation');

dotenv.config();

const seed = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saas_platform';
    console.log(`[Seed] Connecting to MongoDB at ${mongoURI}...`);
    await mongoose.connect(mongoURI);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Organization.deleteMany({}),
      OrganizationMembership.deleteMany({}),
      Subscription.deleteMany({}),
      AuditLog.deleteMany({}),
      Project.deleteMany({}),
      Invitation.deleteMany({}),
    ]);

    console.log('[Seed] Creating demo users...');
    const defaultPasswordHash = await User.hashPassword('Password123!');

    const [alex, sarah, mike, elena] = await Promise.all([
      User.create({
        name: 'Alex Vance (Owner)',
        email: 'alex.owner@acme.com',
        passwordHash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&fit=crop&crop=faces',
      }),
      User.create({
        name: 'Sarah Connor (Admin)',
        email: 'sarah.admin@acme.com',
        passwordHash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&fit=crop&crop=faces',
      }),
      User.create({
        name: 'Mike Ross (Member)',
        email: 'mike.member@acme.com',
        passwordHash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&fit=crop&crop=faces',
      }),
      User.create({
        name: 'Elena Rostova (Multi-Tenant)',
        email: 'elena.partner@startup.io',
        passwordHash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=128&fit=crop&crop=faces',
      }),
    ]);

    console.log('[Seed] Creating organizations...');
    // Org 1: Acme Corporation (Free Plan, 3 members)
    const acmeOrg = await Organization.create({
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acme.com',
      owner: alex._id,
      plan: 'free',
      settings: {
        customBranding: 'Acme Cloud Platform',
        supportEmail: 'support@acme.com',
        timezone: 'America/New_York',
      },
    });

    // Org 2: Apex Technologies (Pro Plan, 10 members)
    const apexOrg = await Organization.create({
      name: 'Apex Technologies',
      slug: 'apex-tech',
      domain: 'apextech.io',
      owner: elena._id,
      plan: 'pro',
      settings: {
        customBranding: 'Apex Engine',
        supportEmail: 'help@apextech.io',
        timezone: 'UTC',
      },
    });

    console.log('[Seed] Assigning memberships...');
    // Acme memberships: Alex (Owner), Sarah (Admin), Mike (Member)
    await Promise.all([
      OrganizationMembership.create({
        organizationId: acmeOrg._id,
        userId: alex._id,
        role: 'owner',
      }),
      OrganizationMembership.create({
        organizationId: acmeOrg._id,
        userId: sarah._id,
        role: 'admin',
      }),
      OrganizationMembership.create({
        organizationId: acmeOrg._id,
        userId: mike._id,
        role: 'member',
      }),
    ]);

    // Apex memberships: Elena (Owner), Alex (Admin) -> Demonstrates multi-org switching!
    await Promise.all([
      OrganizationMembership.create({
        organizationId: apexOrg._id,
        userId: elena._id,
        role: 'owner',
      }),
      OrganizationMembership.create({
        organizationId: apexOrg._id,
        userId: alex._id,
        role: 'admin',
      }),
    ]);

    console.log('[Seed] Initializing subscriptions...');
    await Promise.all([
      Subscription.create({
        organizationId: acmeOrg._id,
        planId: 'free',
        status: 'active',
        seatsIncluded: 3,
      }),
      Subscription.create({
        organizationId: apexOrg._id,
        planId: 'pro',
        status: 'active',
        seatsIncluded: 10,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }),
    ]);

    console.log('[Seed] Seeding sample projects (Tenant-Isolated)...');
    await Promise.all([
      Project.create({
        organizationId: acmeOrg._id,
        name: 'Quarterly Sales Pipeline 2026',
        description: 'Tracking B2B software sales deliverables and enterprise leads.',
        status: 'in-progress',
        priority: 'high',
        createdBy: alex._id,
      }),
      Project.create({
        organizationId: acmeOrg._id,
        name: 'Customer Portal Redesign',
        description: 'Migrating legacy client dashboard to modern React and Tailwind design.',
        status: 'planning',
        priority: 'medium',
        createdBy: sarah._id,
      }),
      Project.create({
        organizationId: apexOrg._id,
        name: 'AI Model Deployment v2',
        description: 'Inference pipeline optimization for real-time edge processing.',
        status: 'in-progress',
        priority: 'urgent',
        createdBy: elena._id,
      }),
    ]);

    console.log('[Seed] Seeding audit logs...');
    await Promise.all([
      AuditLog.create({
        organizationId: acmeOrg._id,
        userId: alex._id,
        action: 'organization.created',
        details: { name: 'Acme Corporation', plan: 'free' },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      }),
      AuditLog.create({
        organizationId: acmeOrg._id,
        userId: alex._id,
        action: 'member.invited',
        details: { email: 'sarah.admin@acme.com', role: 'admin' },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      }),
      AuditLog.create({
        organizationId: acmeOrg._id,
        userId: sarah._id,
        action: 'member.joined',
        details: { email: 'sarah.admin@acme.com', role: 'admin' },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 10000),
      }),
      AuditLog.create({
        organizationId: acmeOrg._id,
        userId: alex._id,
        action: 'member.invited',
        details: { email: 'mike.member@acme.com', role: 'member' },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      }),
      AuditLog.create({
        organizationId: acmeOrg._id,
        userId: mike._id,
        action: 'member.joined',
        details: { email: 'mike.member@acme.com', role: 'member' },
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5000),
      }),
      AuditLog.create({
        organizationId: apexOrg._id,
        userId: elena._id,
        action: 'organization.created',
        details: { name: 'Apex Technologies', plan: 'pro' },
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      }),
      AuditLog.create({
        organizationId: apexOrg._id,
        userId: elena._id,
        action: 'subscription.updated',
        details: { fromPlan: 'free', toPlan: 'pro' },
        createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      }),
    ]);

    console.log(`
=====================================================
Database successfully seeded!
=====================================================
Test Accounts (All passwords: Password123!):
1. Alex Vance (Acme Owner, Apex Admin):
   Email: alex.owner@acme.com
2. Sarah Connor (Acme Admin):
   Email: sarah.admin@acme.com
3. Mike Ross (Acme Member):
   Email: mike.member@acme.com
4. Elena Rostova (Apex Owner):
   Email: elena.partner@startup.io

Organizations:
- Acme Corporation: Free Plan (3 members: Max reached)
- Apex Technologies: Pro Plan (2 members: Alex & Elena)
=====================================================
    `);
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seed();
