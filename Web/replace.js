const fs = require('fs')
const path = require('path')

const dir = './src'
const extensions = ['.ts', '.tsx']

function walk(directory) {
  let results = []
  const list = fs.readdirSync(directory)
  for (const file of list) {
    const filePath = path.join(directory, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath))
    } else {
      if (extensions.includes(path.extname(filePath))) {
        results.push(filePath)
      }
    }
  }
  return results
}

const files = walk(dir)
let changedFiles = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  let changed = false

  // Replace Name
  const nameRegex1 = /Mandir\s+Setu/g
  if (nameRegex1.test(content)) {
    content = content.replace(nameRegex1, 'Mandirsetuu')
    changed = true
  }

  // Replace emails
  const emailRegex1 = /info@mandirsetuu\.in/g
  if (emailRegex1.test(content)) {
    content = content.replace(emailRegex1, 'admin@mandirsetuu.com')
    changed = true
  }

  const emailRegex2 = /info@mandirsetuu\.com/g
  if (emailRegex2.test(content)) {
    content = content.replace(emailRegex2, 'admin@mandirsetuu.com')
    changed = true
  }
  
  const emailRegex3 = /support@mandirsetuu\.in/g
  if (emailRegex3.test(content)) {
    content = content.replace(emailRegex3, 'admin@mandirsetuu.com')
    changed = true
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8')
    console.log(`Updated ${file}`)
    changedFiles++
  }
}

console.log(`Total files changed: ${changedFiles}`)
