// Decides whether a MongoDB connection string points only at this machine.
// playwright.config.js refuses to start the tests unless it does, so the tests
// (which create and delete accounts) can never reach MongoDB Atlas or any other server.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

// Returns the host names in a mongodb:// connection string, or null if it
// isn't one. Handles credentials, IPv6 brackets and replica-set host lists,
// which the URL parser does not.
function hostsOf(connectionString) {
    const match = /^mongodb:\/\/([^/?#]*)/i.exec(connectionString);
    if (!match) return null;

    const authority = match[1];
    const hostList = authority.slice(authority.lastIndexOf('@') + 1);
    if (!hostList) return null;

    return hostList.split(',').map((host) => {
        if (host.startsWith('[')) return host.slice(1, host.indexOf(']'));
        return host.split(':')[0];
    });
}

// True only when every host in the string is local. mongodb+srv:// is always
// refused: it resolves hosts through DNS, which is how Atlas is reached.
export function isLocalMongoUrl(connectionString) {
    if (typeof connectionString !== 'string') return false;
    const hosts = hostsOf(connectionString.trim());
    if (!hosts || hosts.length === 0) return false;
    return hosts.every((host) => LOCAL_HOSTS.has(host.toLowerCase()));
}
