const test = require('ava')
const { path: tempPathSync } = require('temp')
const { existsSync, unlinkSync } = require('fs')
const screenshot = require('./')
const { promisify } = require('util')
const path = require('path');
const rimraf = require('rimraf');
const darwinSnapshot = require('./lib/darwin');
const fs = require('fs');
const os = require('os');

test.before(async () => {
  return screenshot.listDisplays().then(displays => {
    console.log('Displays:', JSON.stringify(displays, null, 2), '\n')
  })
})

test('screenshot', t => {
  t.plan(1)
  return screenshot().then(img => {
    t.truthy(Buffer.isBuffer(img))
  })
})

function checkDisplays (t, displays) {
  t.truthy(Array.isArray(displays))
  displays.forEach(disp => {
    t.truthy(disp.name)
    t.truthy(disp.id !== undefined)
  })
}

test('screenshot each display', t => {
  if (screenshot.availableDisplays) {
    return screenshot.availableDisplays().then(displays => {
      checkDisplays(t, displays)

      displays.forEach(display => {
        screenshot(display.id)
      })
    })
  } else {
    t.pass()
  }
})

test('screenshot to a file', t => {
  t.plan(1)
  const tmpName = tempPathSync({ suffix: '.jpg' })
  return screenshot({ filename: tmpName }).then(() => {
    t.truthy(existsSync(tmpName))
    unlinkSync(tmpName)
  })
})

test('screenshot specific screen to a file', t => {
  t.plan(1)
  const tmpName = tempPathSync({ suffix: '.jpg' })
  return screenshot({ filename: tmpName, screen: 0 }).then(() => {
    t.truthy(existsSync(tmpName))
    unlinkSync(tmpName)
  })
})

test('screenshot to a file with a space', t => {
  // https://github.com/bencevans/screenshot-desktop/issues/12
  t.plan(1)
  const tmpName = tempPathSync({ suffix: '.jpg' })
  return screenshot({ filename: tmpName }).then(() => {
    t.truthy(existsSync(tmpName))
    unlinkSync(tmpName)
  })
})

test('parse display output', t => {
  if (screenshot.EXAMPLE_DISPLAYS_OUTPUT && screenshot.parseDisplaysOutput) {
    const disps = screenshot.parseDisplaysOutput(screenshot.EXAMPLE_DISPLAYS_OUTPUT)
    checkDisplays(t, disps)
  }
})

test('darwinSnapshot', async t => {
  // Set up a temporary directory for output
  const tempDir = await promisify(fs.mkdtemp)(path.join(os.tmpdir(), 'screenshot-desktop-test-'));

  const outputPath = path.join(tempDir, 'test.jpg');
  console.log(outputPath);

  // Set up options
  const options = {
    filename: outputPath,
    coordinates: {
      x: 50,
      y: 135,
      width: 1335,
      height: 760,
    },
  };

  try {
    // Take the screenshot
    await darwinSnapshot(options);

    // Check that the output file exists and is not empty
    const stats = await promisify(fs.stat)(outputPath);
    t.truthy(stats.isFile());
    t.truthy(stats.size > 0);
  } finally {
    // Clean up the temporary directory
    await promisify(rimraf)(tempDir);
  }
});
