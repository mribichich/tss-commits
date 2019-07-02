function get(env: keyof Window['env']) {
  return process.env[env] || window.env[env];
}

export default {
  gitlabToken: get('REACT_APP_GITLAB_TOKEN'),
};
