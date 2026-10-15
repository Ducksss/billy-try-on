# Handing over Billy

[← Project README](../README.md)

Billy is a working prototype, live at [billy-try-on.vercel.app](https://billy-try-on.vercel.app), with no real users, sellers or measured outcomes yet. This note lists what a new owner has to take over, what is unfinished, and where the plan for the next stage lives. It was written on 15 October 2026. For setup, configuration and tests, read the [development guide](DEVELOPMENT.md).

## Accounts and keys to transfer

Every live try-on spends credits on the OpenAI account whose key is in Vercel, so move that key first.

| Service | Used for | Where it's set | At handover |
| --- | --- | --- | --- |
| GitHub [`Ducksss/billy-try-on`](https://github.com/Ducksss/billy-try-on) | Source, issues and pull requests | GitHub | Make the new owner an admin, or transfer the repository |
| Vercel project `billy-try-on`, team `ducksss-projects` | Hosting. Every push to `main` deploys production; other branches get previews | Vercel dashboard | Invite the new owner to the team, or transfer the project |
| OpenAI API key | Photo try-on and `npm run assets` | Vercel env `OPENAI_API_KEY`, and each developer's `web/.env.local` | Swap in the new owner's key, then revoke the old one |
| Decart API key | Optional live mirror | Not set in production | Only needed to turn the mirror on |
| Gemini API key | Optional second try-on provider | Not set in production | Only needed to switch provider |
| GitHub apps: Vercel, CodeRabbit, ImgBot | Deploy previews, automated PR review, image compression PRs | Repository settings | Keep or remove; none hold secrets |

Production also sets `BILLY_TRYON_PROVIDER`, `BILLY_OPENAI_MODEL`, `BILLY_OPENAI_QUALITY` and `BILLY_RATE_LIMIT_PER_HOUR`. All five variables apply to Production only, so try-ons fail on preview deployments until they are also added for Preview.

The Chrome extension is not on the Chrome Web Store. Shoppers download a ZIP from [/extension](https://billy-try-on.vercel.app/extension), which `npm run pack:extension` rebuilds.

## Open work

| Item | State | What to do |
| --- | --- | --- |
| [Ducksss/billy-try-on#2](https://github.com/Ducksss/billy-try-on/pull/2), stop tracking `.claude/launch.json` | Ready, checks pass | Merge |
| [Ducksss/billy-try-on#3](https://github.com/Ducksss/billy-try-on/pull/3), ImgBot image compression | Ready, checks pass | Merge |
| Branch `claude/waitlist-test`: `/join/*` landing pages, waitlist and a daily try-on cap | Parked as a draft pull request. Tested locally, never run against a real backend | Use it for Step 1 of the plan. It needs an InsForge project, set up as that branch's development guide describes |

## Known risks

The full list is under [Known limits](DEVELOPMENT.md#known-limits). The three that matter first:

- **Cost.** `/api/try-on` is public and spends the OpenAI key. The only guard in `main` is an in-memory per-IP limit, which resets on deploy and is separate on each server instance. Set a spending cap on the OpenAI account, or merge the daily cap from `claude/waitlist-test`, before sending traffic.
- **Live mirror.** It has never run against a real Decart session. Test it with a funded key before showing it.
- **Extension permissions.** The extension asks for access to every site. A Chrome Web Store release needs a narrower permission or a written justification.

Lower priority: the server-side garment download checks where a hostname resolves, but a name that changes its DNS answer between the check and the fetch (DNS rebinding) can still reach an internal address. Only JPEG, PNG and WebP responses are accepted, and they go to the image model rather than back to the caller, so the exposure is small.

## What comes next

The [Billy next-step plan](https://claude.ai/code/artifact/c6ee5a33-df0f-41e9-853f-be6404729ef5) turns the pitch panel's feedback into a 12-week path: test three USP promises, run a consumer beta and a seller pilot, then launch. The doc is private, so ask the current maintainer to share it. The [pitch deck and presenter notes](slides/README.md) explain the prototype and the proposed shopper pilot.
