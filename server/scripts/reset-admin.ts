#!/usr/bin/env tsx
import { editorialStore } from '../services/editorialStore.ts';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
=====================================================
FactInfoLive — Secure Admin Password Reset Tool (CLI)
=====================================================

Usage:
  npm run reset-admin <username> <new_password>

Requirements:
  - Password must be at least 12 characters long.
  - Can only be executed locally in server environment.
  - Password is never printed to logs or public network.
`);
  process.exit(1);
}

const [username, newPassword] = args;

if (newPassword.length < 12) {
  console.error('Error: New password must be at least 12 characters long.');
  process.exit(1);
}

const result = editorialStore.resetAdminPassword(username, newPassword);

if (result.success) {
  console.log('✓ SUCCESS:', result.message);
  process.exit(0);
} else {
  console.error('✗ ERROR:', result.message);
  process.exit(1);
}
