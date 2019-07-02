import axios from 'axios';
import moment from 'moment';
import config from './config';

const gitlabAxios = axios.create({
  baseURL: 'https://gitlab.tss.com.ar/api/v4',
  timeout: 15000,
  headers: { 'PRIVATE-TOKEN': config.gitlabToken },
});

export type Commit = {
  id: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: Date;
  committed_date: Date;
  committer_email: string;
  committer_name: string;
  created_at: Date;
  parent_ids: string[];
  short_id: string;
  stats: { additions: number; deletions: number; total: number };
  title: string;
};

export type Issue = {
  id: string;
  description: string;
};

export type IssueNote = {
  id: string;
  body: string;
};

export async function getCommit(projectId: string, sha: string) {
  const pId = encodeURIComponent(projectId);

  const resp = await gitlabAxios.get<Commit>(`projects/${pId}/repository/commits/${sha}`);

  return resp.data;
}

export async function getIssue(projectId: string, issueId: number) {
  const pId = encodeURIComponent(projectId);

  const resp = await gitlabAxios.get<Issue>(`projects/${pId}/issues/${issueId}`);

  return resp.data;
}

export async function getIssueNotes(projectId: string, issueId: number) {
  const pId = encodeURIComponent(projectId);

  const resp = await gitlabAxios.get<IssueNote[]>(`projects/${pId}/issues/${issueId}/notes`);

  return resp.data;
}

type GetCommitsOptions = {
  all?: boolean;
  with_stats?: boolean;
  per_page?: number;
};

export async function getCommits(projectId: string, options: GetCommitsOptions) {
  const pId = encodeURIComponent(projectId);
  options = options || {};

  const params = {
    all: options.all,
    with_stats: options.with_stats,
    per_page: options.per_page,
  };

  const resp = await gitlabAxios.get<Commit[]>(`projects/${pId}/repository/commits`, { params });

  return resp.data.map(m => ({
    ...m,
    authored_date: moment(m.authored_date).toDate(),
    committed_date: moment(m.committed_date).toDate(),
    created_at: moment(m.created_at).toDate(),
  }));
}
