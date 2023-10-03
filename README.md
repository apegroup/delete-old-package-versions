
# Delete Old Package Versions

Deletes all versions of the packages defined by the "package-names" besides the "min-versions-to-keep"



## Installation

run npm to fetch node modules
```bash
  npm install
```
to publish a new version push a new tag to main:

```bash
  git tag v5.0.0-test26 HEAD
  git push origin --tags  
```