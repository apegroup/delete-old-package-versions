
# Delete Old Package Versions

Deletes all versions of the packages defined by the "package-names" besides the "min-versions-to-keep"



## Installation

run npm to fetch node modules
```bash
  npm install
```
to publish a new version push a new tag to main:

```bash
  git tag v1.0.0 HEAD
  git push origin --tags  
```

## How to use

```yaml
- name: Delete packages
  uses: apegroup/delete-old-package-versions@v0.0.13
  with:
    package-names: ${{ env.PACKAGE_NAMES }}
    min-versions-to-keep: 10 # Keep the 10 most recent releases.
    package-type: maven
    token: ${{ secrets.GITHUB_TOKEN }}
```
