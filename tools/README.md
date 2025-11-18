# CVstomize Testing Tools

Tools to help with manual testing of the CVstomize application.

## 🧪 Test Tracker

**File:** `test-tracker.html`

An interactive testing assistant that helps you manually test CVstomize while automatically tracking your progress.

### Features:

- **Auto-Checklist**: Follows along with the COMPLETE_UI_TESTING_GUIDE.md
- **Progress Tracking**: Real-time stats on completed tests
- **Step-by-Step Guidance**: Check off each test step as you complete it
- **Pass/Fail/Skip Marking**: Easily mark test results
- **Notes for Each Test**: Add detailed notes about issues or observations
- **Quick Notes**: Floating notepad for general observations
- **Export Report**: Generate a markdown test report with all results
- **Auto-Save**: All progress saved to browser localStorage

### How to Use:

1. **Open the tracker:**
   ```bash
   # From project root
   open tools/test-tracker.html
   # Or double-click the file in your file browser
   ```

2. **Start testing:**
   - Open the CVstomize app in another browser window
   - Select a test section from the left sidebar
   - Follow the test steps
   - Check off each step as you complete it
   - Mark the test as Pass/Fail/Skip

3. **Add notes:**
   - Use the textarea under each test for detailed notes
   - Use Quick Notes (bottom right) for general observations

4. **Export results:**
   - Click "Export Test Report" when done
   - Gets a markdown file with all your results

### Tips:

- **Work at your own pace** - Progress is automatically saved
- **Don't skip notes** - Document issues while they're fresh
- **Test in incognito** - Some tests require fresh browser sessions
- **Use Quick Notes** - Capture general observations that don't fit a specific test
- **Export often** - Save your progress by exporting periodically

## 📝 Visual Notes (Coming Soon)

A screenshot annotation tool will be added to help you markup the UI and leave visual notes.

## 🎯 Test Coverage

The test tracker covers these areas:

1. **Authentication & Account Management** (4 tests)
2. **Resume Generation - WITHOUT Upload** (3 tests)  
3. **Resume Generation - WITH Upload** (2 tests)
4. **Resume History & Management** (3 tests)
5. **Profile Management** (2 tests)
6. **Downloads & Export** (2 tests)

**Total: 16 comprehensive tests**

## 💾 Data Storage

All test results are stored in your browser's localStorage:
- `cvstomize-test-results` - Test completion status and notes
- `cvstomize-quick-notes` - Quick notes with timestamps

To clear and start over:
```javascript
// Open browser console and run:
localStorage.removeItem('cvstomize-test-results');
localStorage.removeItem('cvstomize-quick-notes');
location.reload();
```

## 📊 Test Report Format

Exported reports include:
- Summary statistics (pass/fail/skip counts)
- Detailed results for each test
- All notes and observations
- Quick notes with timestamps
- Markdown formatting for easy sharing

## 🔧 Customization

You can customize the test data by editing the `testData` object in the HTML file. The structure follows your COMPLETE_UI_TESTING_GUIDE.md format.
