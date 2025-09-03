#!/usr/bin/env node

/**
 * Seed data script
 * Run this script to add sample rulemaking data
 */

require('dotenv').config({ path: '../.env' });
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/bigquery');

const sampleRulemakings = [
  {
    id: uuidv4(),
    agency: 'CFPB',
    title: 'Legal Standard Applicable to Supervisory Designation Proceedings',
    description: `The Consumer Financial Protection Bureau (CFPB) is proposing to change its rules to require "high likelihood of significant harm" before it can investigate financial companies, instead of the current "reasonable cause" standard. This could prevent the agency from stopping discrimination, predatory lending, and other harmful practices before consumers are seriously hurt.

The proposed rule would make it much harder for the CFPB to take action against financial companies that may be engaging in harmful practices. Under the current standard, the CFPB can investigate when there is "reasonable cause to determine risks to consumers." The new standard would require the agency to show a "high likelihood of significant harm" before taking action.

This change could delay or prevent the CFPB from addressing systemic issues in the financial services industry, potentially leaving consumers vulnerable to harmful practices.`,
    docket_id: 'CFPB-2025-0018',
    federal_register_url: 'https://www.regulations.gov/docket/CFPB-2025-0018',
    comment_deadline: '2025-09-25',
    status: 'active',
    context_documents: JSON.stringify([
      'CFR-2025-title12-vol8-chapIX.pdf',
      'Federal Register Legal Standard Applicable to Supervisory Designation Proceedings.pdf',
      'NCRC Comment Legal Standard Applicable to Supervisory Designation Proceedings.pdf'
    ]),
    legal_analysis: `The proposed rule change would fundamentally alter the CFPB's supervisory authority by raising the threshold for action from "reasonable cause to determine risks" to "high likelihood of significant harm." This change could:

1. Delay intervention until after consumers have already been harmed
2. Create a higher burden of proof that may be difficult to meet in complex financial cases
3. Reduce the CFPB's ability to prevent systemic issues before they become widespread
4. Undermine the agency's proactive supervisory role

The current "reasonable cause" standard allows the CFPB to investigate potential risks based on patterns, complaints, or other indicators of harm. The proposed "high likelihood of significant harm" standard would require the agency to demonstrate that harm is not just possible, but highly probable, before taking action.`,
    opposition_points: JSON.stringify([
      'Raises the burden of proof for CFPB action, potentially delaying consumer protection',
      'Could prevent proactive supervision of emerging risks',
      'May allow harmful practices to continue until significant damage occurs',
      'Undermines the CFPB\'s mission to prevent consumer harm',
      'Creates uncertainty about when the agency can take action'
    ]),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function seedData() {
  console.log('🌱 Seeding sample data...');
  
  try {
    // Insert sample rulemakings
    for (const rulemaking of sampleRulemakings) {
      await db.insert('rulemakings', [rulemaking]);
      console.log(`✅ Added rulemaking: ${rulemaking.title}`);
    }
    
    console.log('\n🎉 Sample data seeded successfully!');
    console.log(`📋 Added ${sampleRulemakings.length} rulemaking(s)`);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;
