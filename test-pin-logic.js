const mongoose = require('mongoose')

const MONGODB_URI = 'mongodb://localhost:27017/jobless'

async function testPinLogic() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB\n')

    const db = mongoose.connection.db
    const contentCollection = db.collection('contents')

    // Get all contents sorted by backend logic
    console.log('=== TEST 1: Default Sorting (createdAt DESC) ===')
    const defaultSort = await contentCollection
      .find({ status: 'published' })
      .sort({ isAdminPinned: -1, isPinned: -1, createdAt: -1 })
      .toArray()

    console.log('Total published content:', defaultSort.length)
    console.log('\nFirst 5 items (should be newest first):')
    defaultSort.slice(0, 5).forEach((c, i) => {
      console.log(`${i + 1}. ${c.title}`)
      console.log(`   createdAt: ${c.createdAt.toISOString()}`)
      console.log(`   adminPinned: ${c.isAdminPinned || false}, pinned: ${c.isPinned || false}`)
    })

    if (defaultSort.length > 5) {
      console.log('\nLast 3 items (should be oldest):')
      defaultSort.slice(-3).forEach((c, i) => {
        console.log(`${defaultSort.length - 2 + i}. ${c.title}`)
        console.log(`   createdAt: ${c.createdAt.toISOString()}`)
        console.log(`   adminPinned: ${c.isAdminPinned || false}, pinned: ${c.isPinned || false}`)
      })
    }

    // Find the item at position 7 (should be second oldest)
    // We want to test an item that's NOT on page 1 (if limit is 5)
    const testItemIndex = Math.min(6, defaultSort.length - 2) // Position 7, or second to last
    const testItem = defaultSort[testItemIndex]
    console.log('\n=== TEST 2: Pin Item from Later in List ===')
    console.log(`Pinning: ${testItem.title}`)
    console.log(`Original position: ${testItemIndex + 1}`)
    console.log(`Created at: ${testItem.createdAt.toISOString()}`)

    // Pin it
    await contentCollection.updateOne({ _id: testItem._id }, { $set: { isAdminPinned: true } })

    // Get new sort
    const afterPin = await contentCollection
      .find({ status: 'published' })
      .sort({ isAdminPinned: -1, isPinned: -1, createdAt: -1 })
      .toArray()

    const pinnedPosition = afterPin.findIndex(c => c._id.equals(testItem._id)) + 1
    console.log(`New position after pin: ${pinnedPosition} (should be 1)`)

    console.log('\n=== TEST 3: Unpin Item ===')
    console.log(`Unpinning: ${testItem.title}`)

    // Unpin it
    await contentCollection.updateOne({ _id: testItem._id }, { $set: { isAdminPinned: false } })

    // Get new sort
    const afterUnpin = await contentCollection
      .find({ status: 'published' })
      .sort({ isAdminPinned: -1, isPinned: -1, createdAt: -1 })
      .toArray()

    const unpinnedPosition = afterUnpin.findIndex(c => c._id.equals(testItem._id)) + 1
    console.log(`Position after unpin: ${unpinnedPosition} (should be ${testItemIndex + 1} - original position)`)

    console.log('\n✓ Pin logic test complete!')
    console.log('\nExpected behavior:')
    console.log('1. Default sort: newest first (createdAt DESC)')
    console.log(`2. Pin item from position ${testItemIndex + 1}: goes to position 1`)
    console.log(`3. Unpin: returns to position ${testItemIndex + 1} (original position based on createdAt)`)

    mongoose.disconnect()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testPinLogic()
