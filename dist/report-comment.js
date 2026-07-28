"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportComment = void 0;
exports.examples2Table = examples2Table;
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const util_1 = require("./util");
const actions_replace_comment_1 = __importStar(require("@aki77/actions-replace-comment"));
const MAX_TABLE_ROWS = 20;
const MAX_MESSAGE_LENGTH = 200;
const truncate = (str, maxLength) => {
    return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
};
async function examples2Table(examples) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { markdownTable } = require('markdown-table');
    const baseUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${github.context.sha}`;
    return markdownTable([
        ['Example', 'Description', 'Message'],
        ...examples
            .slice(0, MAX_TABLE_ROWS)
            .map(({ filePath, lineNumber, description, message }) => [
            `[${filePath}:${lineNumber}](${baseUrl}/${filePath}#L${lineNumber})`,
            (0, util_1.sanitizeCell)(description),
            (0, util_1.sanitizeCell)(truncate(message, MAX_MESSAGE_LENGTH).replace(/\\n/g, ' ')).replace(/\s+/g, '&nbsp;')
        ])
    ]);
}
const commentGeneralOptions = () => {
    const pullRequestId = github.context.issue.number;
    if (!pullRequestId) {
        throw new Error('Cannot find the PR id.');
    }
    return {
        token: core.getInput('token', { required: true }),
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: pullRequestId
    };
};
const reportComment = async (result) => {
    const title = core.getInput('title', { required: true });
    if (result.success) {
        const icon = result.success ? ':tada:' : ':cold_sweat:';
        const summary = `${icon} ${result.summary}`;
        if (core.getBooleanInput('reportOnSuccess', { required: true })) {
            await (0, actions_replace_comment_1.default)({
                ...commentGeneralOptions(),
                body: `${title}
${summary}
`
            });
        }
        else {
            await (0, actions_replace_comment_1.deleteComment)({
                ...commentGeneralOptions(),
                body: title,
                startsWith: true
            });
        }
    }
    else {
        await (0, actions_replace_comment_1.default)({
            ...commentGeneralOptions(),
            body: `${title}
<details>
<summary>${result.summary}</summary>

${await examples2Table(result.examples)}

</details>
`
        });
    }
};
exports.reportComment = reportComment;
//# sourceMappingURL=report-comment.js.map