# Argonaut Labs

Public website and reproducible research notes for local AI inference. The site is static HTML, CSS and JavaScript, published with GitHub Pages at [argonautlabs.ai](https://argonautlabs.ai/).

## Run Kimi 3.1 locally on one GPU

[**Argodrive DS4 Kimi K3.1**](https://github.com/argonautlabsai/argodrive-ds4-kimi-k3.1) is the integrated Linux/CUDA engine. The Kimi port, NVMe expert streaming, caches and weight-preparation tools are included. Build that repository and prepare the separately downloaded model weights; no separate upstream ds4 or Argodrive Mac app installation is required. It is currently a source release, not a prebuilt installer.

Our [Kimi K3.1 Pro guide](https://argonautlabs.ai/research/kimi-k31-single-gpu.html) documents an experimental CUDA port tested on one 96 GB RTX PRO 6000 Blackwell, with experts streamed from NVMe. It includes hardware, build instructions, benchmark definitions and validation limits.

- [Kimi K3.1 engine, based on Salvatore Sanfilippo’s ds4](https://github.com/argonautlabsai/argodrive-ds4-kimi-k3.1)
- [November 7 drafter measurements](https://argonautlabs.ai/research/kimi-k31-2026-11-07b.json): 3.11 tok/s decode on the raw financial prompt; chat gains are smaller. Up to 44 tok/s is prefill, not decode.
- Published benchmark profile: 2,048 tokens total; dense attention without DSA. Equivalence to Moonshot’s reference implementation has not been validated.

## Other projects

- [DS4 Argodrive](https://github.com/argonautlabsai/ds4-argodrive): DeepSeek V4.1 streaming experiments on Apple silicon and CUDA.
- [Deltafin fork](https://github.com/argonautlabsai/deltafin): Kimi K3 on Apple silicon, based on gavamedia/deltafin.
- [Argodrive](https://github.com/argonautlabsai/argodrive): SSD layout, scheduling, measurement and monitoring tools.
- [GLM-5.3 measurements](https://argonautlabs.ai/research/glm.html).

## Site maintenance

Serve this directory with a static HTTP server to preview it. Research pages and their JSON evidence live in `research/`. Keep their stable URLs and original benchmark data when updating presentation. Use `sitemap.xml` for the canonical article URLs and `robots.txt` for crawl policy. Changes to the sitemap’s `lastmod` values should reflect actual page updates.

Published results describe the stated hardware, workload and timing definition; they are not guarantees for another machine. Engine credits and validation limits remain linked alongside each result.
