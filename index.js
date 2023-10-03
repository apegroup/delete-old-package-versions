const { getInput, setFailed } = require('@actions/core')
const { context } = require('@actions/github')
const { Octokit } = require('@octokit/core')
const { paginateRest } = require('@octokit/plugin-paginate-rest')


async function run() {
    try {
        // get all input parameters
        const packageNames = getInput('package-names').split(",").map(p => p.trim())
        const minVersionsToKeep = Number(getInput('min-versions-to-keep'))
        const token = getInput('token')

        // initialize github octokit api
        const MyOctokit = Octokit.plugin(paginateRest);
        const octokit = new MyOctokit({ auth: token });

        // get github context information
        const owner = context.repo.owner
        const repo = context.repo.repo

        // get all packages for the current repository
        const packages = await octokit.paginate('GET /repos/{owner}/{repo}/packages', {
            owner: owner,
            repo: repo,
            per_page: 100,
        });

        // only keep packages that match the input packagenames
        const packagesThatMatchNames = packages.filter(p => packageNames.includes(p.name))
        console.info(`found ${packagesThatMatchNames.length} packages to delete versions for`)

        // for every package in this repository
        for (const repoPackage of packagesThatMatchNames) {

            // fetch all the versiobs of this package
            const versions = await octokit.paginate('GET /repos/{owner}/{repo}/packages/{package_type}/{package_name}/versions', {
                owner: owner,
                repo: repo,
                package_type: repoPackage.package_type,
                package_name: repoPackage.name,
                per_page: 100,
            });

            // select all but the X most recent package versions
            const versionsToDelete = versions.splice(0, minVersionsToKeep);
            console.info(`deleting ${versionsToDelete.length} versions for package "${repoPackage.name}"`)


            // delete all package versions we dont want to keep
            for (const version of versionsToDelete) {
                await octokit.request('DELETE /repos/{owner}/{repo}/packages/{package_type}/{package_name}/versions/{package_version_id}', {
                    owner: owner,
                    repo: repo,
                    package_type: repoPackage.package_type,
                    package_name: repoPackage.name,
                    package_version_id: version.versionId,
                });
            }

            console.info(`deleted ${versionsToDelete.length} versions for package "${repoPackage.name}"`)

        }

    } catch (e) {
        setFailed(e)
    }
}
