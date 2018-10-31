
// If there is no 'site' variable in the URL or the 
//   specified site doesn't exist, returns undefined.

function getSiteFromURL(sites) {
    const urlParams = new URLSearchParams(window.location.search);
    const gid = urlParams.get('site');
    const site = _.find(sites, ['G_ID', gid])
    return site;
}
