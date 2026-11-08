# Argonaut Labs

Public website and reproducible research notes for local AI inference. The site is static HTML, CSS and JavaScript, published with GitHub Pages at [argonautlabs.ai](https://argonautlabs.ai/).

## Run Kimi K3.1 Pro locally on one GPU

**New installation:** [Get the engine, prepare the weights and run Kimi](https://argonautlabs.ai/guides/install-kimi-k31.html).

[**Argodrive DS4 Kimi K3.1**](https://github.com/argonautlabsai/argodrive-ds4-kimi-k3.1) is the integrated Linux/CUDA engine. The Kimi port, NVMe expert streaming, caches and weight-preparation tools are included. Build that repository and prepare the separately downloaded model weights; no separate upstream ds4 or Argodrive Mac app installation is required. It is currently a source release, not a prebuilt installer.

Our [Kimi K3.1 Pro guide](https://argonautlabs.ai/research/kimi-k31-single-gpu.html) documents an experimental CUDA port tested on one 96 GB RTX PRO 6000 Blackwell, with experts streamed from NVMe. It includes hardware, build instructions, benchmark definitions and validation limits.

- [Kimi K3.1 engine, based on Salvatore Sanfilippo’s ds4](https://github.com/argonautlabsai/argodrive-ds4-kimi-k3.1)
- [November 8 measurements](https://argonautlabs.ai/research/kimi-k31-2026-11-08.json): 3.05 tok/s on the raw financial prompt with the drafter; 43 tok/s is prefill, not decode. The November 7 short-chat test measured 2.01–2.02 tok/s; historical results remain in the article.
- Current sparse-attention release: context caches measured at 4k, 8k and 16k; long-prompt decode 1.48–1.51 tok/s. Equivalence to Moonshot’s reference implementation has not been validated.
- [Apple silicon benchmark archive](https://argonautlabs.ai/research/apple-silicon-results.html): preserved drive ladders and tables for the earlier models.

## Other projects

- [DS4 Argodrive](https://github.com/argonautlabsai/ds4-argodrive): DeepSeek V4.1 streaming experiments on Apple silicon and CUDA.
- [Deltafin fork](https://github.com/argonautlabsai/deltafin): Kimi K3 on Apple silicon, based on gavamedia/deltafin.
- [Argodrive](https://github.com/argonautlabsai/argodrive): SSD layout, scheduling, measurement and monitoring tools.
- [GLM-5.3 measurements](https://argonautlabs.ai/research/glm.html).

## Site maintenance

Serve this directory with a static HTTP server to preview it. Research pages and their JSON evidence live in `research/`. Keep their stable URLs and original benchmark data when updating presentation. Use `sitemap.xml` for the canonical article URLs and `robots.txt` for crawl policy. Changes to the sitemap’s `lastmod` values should reflect actual page updates.

Published results describe the stated hardware, workload and timing definition; they are not guarantees for another machine. Engine credits and validation limits remain linked alongside each result.
