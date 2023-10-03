const core = require('@actions/core')
const github = require('@actions/github')
const octokitCore = require('@octokit/core')
const paginate = require('@octokit/plugin-paginate-rest')

async function run() {
    try {
        // get all input parameters
        const packageNames = core.getInput('package-names').split(",").map(p => p.trim())
        const minVersionsToKeep = Number(core.getInput('min-versions-to-keep'))
        const token = core.getInput('token')
        const packageType = core.getInput('package-type')

        // initialize github octokit api
        const MyOctokit = octokitCore.Octokit.plugin(paginate.paginateRest);
        const octokit = new MyOctokit({ auth: token });

        // get github context information
        const owner = github.context.repo.owner
        const repo = github.context.repo.repo

        // get all packages for the current repository
        const packages = await octokit.paginate('GET /orgs/{org}/packages', {
            package_type: packageType,
            org: owner,
            per_page: 100,
        });

        // only keep packages that match the input packagenames
        const packagesThatMatchNames = packages.filter(p => packageNames.includes(p.name))
        console.info(`found ${packagesThatMatchNames.length} packages to delete versions for`)

        // for every package in this repository
        for (const repoPackage of packagesThatMatchNames) {

            // fetch all the versiobs of this package
            const versions = await octokit.paginate('GET /orgs/{org}/packages/{package_type}/{package_name}/versions', {
                org: owner,
                package_type: packageType,
                package_name: repoPackage.name,
                per_page: 100,
            });

            // select all but the X most recent package versions
            versions.splice(0, minVersionsToKeep);
            console.info(`deleting ${versions.length} versions for package "${repoPackage.name}"`)


            // delete all package versions we dont want to keep
            for (const version of versions) {
                // TODO run in parrallel (Promise.all)
                await octokit.request('DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}', {
                    org: owner,
                    package_type: packageType,
                    package_name: repoPackage.name,
                    package_version_id: version.id,
                });
            }

            console.info(`deleted ${versions.length} versions for package "${repoPackage.name}"`)

        }

    } catch (e) {
        core.setFailed(e)
    }
}

run() // execute script