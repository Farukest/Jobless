const fs = require('fs');
const path = require('path');

const badgesDir = 'C:\\Users\\Farukest-Working\\Desktop\\PROJECT\\Jobless\\frontend\\src\\components\\badges';
const htmlFiles = [
  'member.html',
  'content_creator.html',
  'designer.html',
  'scout.html',
  'admin.html',
  'super_admin.html',
  'mentor.html',
  'learner.html',
  'requester.html'
];

const badgeMapping = {
  // Member badges
  'badge-rookie': 'RookieBadge',
  'badge-explorer': 'ExplorerBadge',
  'badge-connected': 'ConnectedBadge',
  'badge-active-member': 'ActiveMemberBadge',
  'badge-profile-complete': 'ProfileCompleteBadge',
  'badge-point-collector': 'PointCollectorBadge',
  'badge-veteran': 'VeteranBadge',
  'badge-point-master': 'PointMasterBadge',
  'badge-contributor': 'ContributorBadge',
  'badge-elite-member': 'EliteMemberBadge',
  'badge-platform-champion': 'PlatformChampionBadge',
  'badge-legend': 'LegendBadge',
  'badge-early-adopter': 'EarlyAdopterBadge',
  'badge-anniversary': 'AnniversaryBadge',

  // Content Creator badges
  'badge-first-post': 'FirstPostBadge',
  'badge-video-starter': 'VideoStarterBadge',
  'badge-thread-weaver': 'ThreadWeaverBadge',
  'badge-podcast-pioneer': 'PodcastPioneerBadge',
  'badge-consistent-creator': 'ConsistentCreatorBadge',
  'badge-popular-post': 'PopularPostBadge',
  'badge-multi-format': 'MultiFormatBadge',
  'badge-prolific': 'ProlificBadge',
  'badge-viral-hit': 'ViralHitBadge',
  'badge-content-master': 'ContentMasterBadge',
  'badge-content-titan': 'ContentTitanBadge',
  'badge-mega-viral': 'MegaViralBadge',
  'badge-hub-immortal': 'HubImmortalBadge',

  // Designer badges
  'badge-design-rookie': 'DesignRookieBadge',
  'badge-first-delivery': 'FirstDeliveryBadge',
  'badge-reliable-designer': 'ReliableDesignerBadge',
  'badge-client-favorite': 'ClientFavoriteBadge',
  'badge-studio-pro': 'StudioProBadge',
  'badge-design-veteran': 'DesignVeteranBadge',
  'badge-studio-elite': 'StudioEliteBadge',
  'badge-design-titan': 'DesignTitanBadge',
  'badge-legendary-creator': 'LegendaryCreatorBadge',

  // Scout badges
  'badge-first-scout': 'FirstScoutBadge',
  'badge-alpha-hunter': 'AlphaHunterBadge',
  'badge-consistent-scout': 'ConsistentScoutBadge',
  'badge-popular-alpha': 'PopularAlphaBadge',
  'badge-active-scout': 'ActiveScoutBadge',
  'badge-alpha-pro': 'AlphaProBadge',
  'badge-community-favorite': 'CommunityFavoriteBadge',
  'badge-veteran-scout': 'VeteranScoutBadge',
  'badge-alpha-master': 'AlphaMasterBadge',
  'badge-legendary-scout': 'LegendaryScoutBadge',

  // Mentor badges
  'badge-mentor': 'MentorBadge',
  'badge-first-course': 'FirstCourseBadge',
  'badge-course-starter': 'CourseStarterBadge',
  'badge-popular-mentor': 'PopularMentorBadge',
  'badge-active-mentor': 'ActiveMentorBadge',
  'badge-beloved-mentor': 'BelovedMentorBadge',
  'badge-prolific-mentor': 'ProlificMentorBadge',
  'badge-master-mentor': 'MasterMentorBadge',
  'badge-celebrity-mentor': 'CelebrityMentorBadge',
  'badge-legendary-mentor': 'LegendaryMentorBadge',

  // Learner badges
  'badge-learner': 'LearnerBadge',
  'badge-first-enrollment': 'FirstEnrollmentBadge',
  'badge-first-completion': 'FirstCompletionBadge',
  'badge-eager-learner': 'EagerLearnerBadge',
  'badge-dedicated-learner': 'DedicatedLearnerBadge',
  'badge-active-learner': 'ActiveLearnerBadge',
  'badge-course-completer': 'CourseCompleterBadge',
  'badge-knowledge-seeker': 'KnowledgeSeekerBadge',
  'badge-master-student': 'MasterStudentBadge',
  'badge-eternal-learner': 'EternalLearnerBadge',

  // Requester badges
  'badge-requester': 'RequesterBadge',
  'badge-first-request': 'FirstRequestBadge',
  'badge-active-requester': 'ActiveRequesterBadge',
  'badge-popular-request': 'PopularRequestBadge',
  'badge-prolific-requester': 'ProlificRequesterBadge',
  'badge-request-fulfilled': 'RequestFulfilledBadge',
  'badge-master-requester': 'MasterRequesterBadge',

  // Admin badges
  'badge-admin': 'AdminBadge',
  'badge-active-moderator': 'ActiveModeratorBadge',
  'badge-veteran-admin': 'VeteranAdminBadge',
  'badge-platform-guardian': 'PlatformGuardianBadge',

  // Super Admin badges
  'badge-super-admin': 'SuperAdminBadge',
  'badge-platform-architect': 'PlatformArchitectBadge',
  'badge-platform-overlord': 'PlatformOverlordBadge',
  'badge-god-mode': 'GodModeBadge'
};

console.log('🔄 Converting HTML badges to React components...\n');

// Extract all SVG symbols from HTML files
const allSymbols = {};

htmlFiles.forEach(file => {
  const filePath = path.join(badgesDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract symbol blocks
  const symbolRegex = /<symbol id="(badge-[^"]+)"[^>]*>([\s\S]*?)<\/symbol>/g;
  let match;

  while ((match = symbolRegex.exec(content)) !== null) {
    const symbolId = match[1];
    const symbolContent = match[2];
    const componentName = badgeMapping[symbolId];

    if (componentName) {
      allSymbols[componentName] = { symbolId, symbolContent };
      console.log(`✓ Found ${componentName} (${symbolId})`);
    }
  }
});

console.log(`\n✅ Total badges found: ${Object.keys(allSymbols).length}\n`);
console.log('📝 Generated badge list saved to badge-list.txt');

// Write badge list
fs.writeFileSync(
  path.join(badgesDir, 'badge-list.txt'),
  Object.keys(allSymbols).map(name => `- ${name}`).join('\n')
);
