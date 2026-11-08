# Custom domain — royalrosebygagan.com

Domain registration and DNS: Wix. Website hosting: GitHub Pages, repository `Anmoldotkapoor/REDROSESTUDIO`, branch `main`, root folder. ChatGPT Sites is not used for this connection.

Primary address: https://royalrosebygagan.com/

Academy: https://royalrosebygagan.com/academy.html

## DNS configuration

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | root / blank | 185.199.108.153 | 1 hour |
| A | root / blank | 185.199.109.153 | 1 hour |
| A | root / blank | 185.199.110.153 | 1 hour |
| A | root / blank | 185.199.111.153 | 1 hour |
| CNAME | www | anmoldotkapoor.github.io | 1 hour |

Wix nameservers remain `ns10.wixdns.net` and `ns11.wixdns.net`. The default Wix parking A records and `initial.wixdns.net` www alias were replaced. No mail service or unrelated DNS records were changed.

GitHub Pages custom domain is `royalrosebygagan.com`; the tracked root `CNAME` file must retain that exact name. Both pages use the new primary domain for canonical and social image URLs. Configure HTTPS enforcement when GitHub finishes issuing its certificate. DNS propagation and certificate readiness are verified separately from saving settings.

Use the domain without `/REDROSESTUDIO/` in its path. Relative page, image, stylesheet, script and feed paths continue to work from the custom-domain root.

References: [GitHub custom-domain configuration](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Wix external-site DNS setup](https://support.wix.com/en/article/connecting-a-wix-domain-to-an-external-site).
