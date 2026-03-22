/**
 * Migration Script: Update Conversations with Cached Data
 * 
 * This script populates the new fields (gigTitle, clientName, freelancerName)
 * for existing conversations in the database.
 * 
 * Run this once after deploying the updated Conversation model.
 * 
 * Usage: node scripts/migrateConversations.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Conversation = require('../models/conversation');
const Gig = require('../models/gig');
const User = require('../models/user');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }
};

// Main migration function
const migrateConversations = async () => {
  try {
    console.log('🔄 Starting conversation migration...\n');

    // Find all conversations that need migration
    const conversations = await Conversation.find({
      $or: [
        { gigTitle: { $exists: false } },
        { clientName: { $exists: false } },
        { freelancerName: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${conversations.length} conversations to migrate\n`);

    if (conversations.length === 0) {
      console.log('✨ No conversations need migration. All done!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const conv of conversations) {
      try {
        // Fetch related data
        const [gig, client, freelancer] = await Promise.all([
          Gig.findById(conv.gigId).select('title'),
          User.findById(conv.clientId).select('name'),
          User.findById(conv.freelancerId).select('name')
        ]);

        // Validate data exists
        if (!gig) {
          console.warn(`⚠️  Gig not found for conversation ${conv._id}`);
          errorCount++;
          continue;
        }
        if (!client) {
          console.warn(`⚠️  Client not found for conversation ${conv._id}`);
          errorCount++;
          continue;
        }
        if (!freelancer) {
          console.warn(`⚠️  Freelancer not found for conversation ${conv._id}`);
          errorCount++;
          continue;
        }

        // Update conversation
        conv.gigTitle = gig.title;
        conv.clientName = client.name;
        conv.freelancerName = freelancer.name;
        await conv.save();

        successCount++;
        console.log(`✅ Migrated: ${conv._id} - "${gig.title}"`);

      } catch (err) {
        errorCount++;
        console.error(`❌ Error migrating conversation ${conv._id}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Migration Complete!');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${conversations.length}`);
    console.log('='.repeat(50) + '\n');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
};

// Run migration
const run = async () => {
  await connectDB();
  await migrateConversations();
  await mongoose.connection.close();
  console.log('👋 Database connection closed');
  process.exit(0);
};

run();
