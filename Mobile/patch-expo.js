const fs = require('fs');
const path = require('path');

const pluginPath = path.join(__dirname, 'node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');

if (fs.existsSync(pluginPath)) {
  let content = fs.readFileSync(pluginPath, 'utf8');
  if (content.includes('from components.release')) {
    content = content.replace(
      'from components.release',
      'def releaseComponent = components.findByName("release")\n          if (releaseComponent != null) {\n            from releaseComponent\n          }'
    );
    fs.writeFileSync(pluginPath, content, 'utf8');
    console.log('Successfully patched ExpoModulesCorePlugin.gradle for Gradle 8+ compatibility!');
  }
}
