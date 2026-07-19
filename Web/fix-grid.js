const fs = require('fs');
const glob = require('glob'); // wait, glob might not be installed, we can just specify the files

const files = [
  'src/app/front-pages/jyotish/page.tsx',
  'src/app/front-pages/yatra/page.tsx',
  'src/views/front-pages/landing-page/ChoghadiyaSection.tsx',
  'src/views/front-pages/landing-page/HoroscopePanchang.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace <Grid item xs={A} sm={B} md={C} lg={D} ...> with <Grid size={{ xs: A, sm: B, md: C, lg: D }} ...>
  // A generic way is:
  // Find all <Grid item ...> and parse out xs, sm, md, lg attributes, remove item, wrap sizes in size={{}}
  
  content = content.replace(/<Grid item([^>]+)>/g, (match, p1) => {
    let sizeProps = [];
    let otherProps = p1;

    // extract xs
    otherProps = otherProps.replace(/\bxs={([^}]+)}/g, (m, val) => { sizeProps.push(`xs: ${val}`); return ''; });
    // extract sm
    otherProps = otherProps.replace(/\bsm={([^}]+)}/g, (m, val) => { sizeProps.push(`sm: ${val}`); return ''; });
    // extract md
    otherProps = otherProps.replace(/\bmd={([^}]+)}/g, (m, val) => { sizeProps.push(`md: ${val}`); return ''; });
    // extract lg
    otherProps = otherProps.replace(/\blg={([^}]+)}/g, (m, val) => { sizeProps.push(`lg: ${val}`); return ''; });
    // extract xl
    otherProps = otherProps.replace(/\bxl={([^}]+)}/g, (m, val) => { sizeProps.push(`xl: ${val}`); return ''; });

    let sizeStr = sizeProps.length > 0 ? ` size={{ ${sizeProps.join(', ')} }}` : '';
    return `<Grid${sizeStr}${otherProps}>`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Processed ${file}`);
});
