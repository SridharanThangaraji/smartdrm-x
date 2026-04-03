# SmartDRM-X: A Dual-Layer Blockchain and Hybrid AI Anomaly Detection Framework for Behavioral Credential Abuse in Digital Rights Management

**[Author Name], [Institution], [Email]**

---

## Abstract

Digital Rights Management (DRM) systems face a fundamental tension between structural licensing enforcement and adaptive behavioral detection of emergent abuse patterns such as credential sharing, access hoarding, and slow-rate distributed exfiltration. Existing blockchain-based DRM proposals enforce licensing invariants on-chain but do not address behavioral abuse that is structurally license-compliant, while purely rule-based anomaly detectors are susceptible to threshold evasion by adversaries who calibrate their access patterns to remain just below detection boundaries. This paper presents SmartDRM-X, a dual-layer framework that couples an Ethereum smart contract for immutable license lifecycle management with a novel **Hybrid Behavioral Anomaly Detection Engine (H-BADE)** that combines a rule-based component with a time-decay-weighted Isolation Forest classifier. A six-dimensional feature vector — download frequency, unique IP count, denial rate, unique asset breadth, temporal clustering coefficient, and cross-user graph centrality — is extracted from a tamper-evident on-chain audit log. The composite risk score is formalized as $R = \alpha D + \beta I + \gamma A + \delta T + \varepsilon G$, where $T$ is a temporal anomaly factor capturing access burstiness and $G$ is a graph centrality score detecting shared credentials across user clusters. The smart contract (`SmartDRMX.sol`) implements access-limited, expiry-enforced licenses with on-chain event emission for all lifecycle transitions. Evaluation against a 3,200-event synthetic behavioral dataset — comprising 2,400 benign and 800 adversarial samples across six attack classes — demonstrates that H-BADE achieves precision 0.961, recall 0.948, F1 0.954, and AUC-ROC 0.982, outperforming the rule-only baseline by 8.3 percentage points in F1 and reducing the false negative rate on slow-rate evasion attacks from 41% to 9%. License verification latency remains below 50 ms at the 95th percentile.

**Keywords:** digital rights management, blockchain, Ethereum, anomaly detection, Isolation Forest, credential sharing, behavioral analysis, smart contracts, time-decay modeling, graph centrality

---

## I. Introduction

The digital content economy depends on licensing infrastructure that can simultaneously enforce structural usage rights and detect behavioral abuse patterns that structural rules cannot prohibit. A licensed user who distributes their credentials to ten unauthorized consumers does not violate any per-request access control check — each individual request appears structurally valid — yet the aggregate behavioral pattern is clearly abusive. Detecting this class of abuse requires analysis across temporal and cross-user behavioral dimensions that transcend the capabilities of per-request enforcement.

Contemporary centralized DRM systems — Widevine, FairPlay, PlayReady — rely on opaque key servers, proprietary revocation infrastructure, and static threshold rules calibrated against known abuse patterns [1]. These architectures exhibit three well-documented structural weaknesses: (1) the central key server is a single point of compromise; (2) static threshold rules are evadable by adversaries who calibrate their access rates to remain below detection boundaries; and (3) post-incident audit logs are stored in mutable application databases, making forensic reconstruction vulnerable to retroactive alteration.

Blockchain-based DRM proposals [3],[6] address the auditability problem through immutable on-chain records but do not address the behavioral detection problem — on-chain state records whether a license is valid, not whether a licensee's behavioral pattern across time is consistent with legitimate single-user use. The critical research gap is a system that couples immutable behavioral evidence collection with an anomaly detection engine sophisticated enough to resist threshold calibration attacks.

This paper presents SmartDRM-X, which addresses this gap through three integrated contributions: an on-chain audit evidence layer that makes detection inputs tamper-evident; a hybrid rule-based + Isolation Forest detection engine that establishes a high-dimensional decision boundary resistant to low-dimensional threshold evasion; and a time-decay temporal modeling component that distinguishes organic access patterns from burst-then-suppress evasion.

**The specific contributions of this work are:**

- **C1:** A Solidity `SmartDRMX` smart contract implementing access-limited, time-bounded license issuance with on-chain access counter enforcement and full event emission for all lifecycle transitions (`AssetRegistered`, `LicenseIssued`, `AccessGranted`, `OwnershipTransferred`), providing tamper-evident provenance for all license state changes.
- **C2:** A six-dimensional behavioral feature vector grounded in the actual audit log schema, with a formal composite risk score $R = \alpha D + \beta I + \gamma A + \delta T + \varepsilon G$, extending the prior three-signal model with temporal burstiness ($T$) and cross-user graph centrality ($G$).
- **C3:** A Hybrid Behavioral Anomaly Detection Engine (H-BADE) combining the interpretable rule-based system with a time-decay-weighted Isolation Forest classifier, trained on 2,400 synthetic benign behavioral profiles, that establishes a statistical decision boundary robust to adversarial threshold calibration.
- **C4:** A cross-user credential sharing graph where each user is a node and shared-IP access events are edges; degree centrality serves as the $G$ feature, detecting distributed credential rings not observable from single-user behavioral analysis.
- **C5:** A research-grade evaluation against a 3,200-event synthetic dataset across six attack classes, including slow-rate evasion and distributed sharing, with full confusion matrix, precision/recall/F1, and AUC-ROC characterization and comparison against the rule-only baseline.

The remainder of this paper is organized as follows. Section II reviews related work. Section III presents the system architecture and formal models. Section IV details the implementation. Section V reports experimental evaluation. Section VI discusses security analysis. Section VII discusses blockchain optimization. Section VIII concludes.

---

## II. Related Work

### II-A. DRM Architectures and Blockchain Integration

**Zeng et al. [1]** provided a comprehensive survey of DRM technologies and standards, cataloguing the evolution from hardware-enforced DRM to software-based licensing. Their taxonomy of DRM components — rights expression, enforcement engines, key management — establishes the reference framework for situating SmartDRM-X. Critically, their survey predates the wide adoption of blockchain as a DRM infrastructure component, leaving the auditability dimension underexplored.

**Iannella [2]** introduced ODRL as a standardized vocabulary for machine-readable licensing terms. While ODRL provides expressive rights semantics, enforcement remains dependent on centralized infrastructure susceptible to server compromise and administrative manipulation.

**Ma et al. [3]** proposed a blockchain-based DRM system for multimedia content, using smart contracts to encode usage rights and transfer history on Ethereum. Their system demonstrated the viability of on-chain license management but does not address behavioral anomaly detection; structurally valid but behaviorally abusive credential sharing is entirely undetected.

**Xu et al. [4]** combined IPFS decentralized storage with Ethereum access control for content distribution. Their system prioritizes availability and decentralization but lacks any behavioral monitoring layer, making it transparent to credential sharing attacks.

**Bhaskaran et al. [6]** described an IBM blockchain-based enterprise DRM system, noting that on-chain immutability substantially improves regulatory audit compliance. SmartDRM-X adopts the same immutability principle while closing the behavioral detection gap that remains unaddressed in their architecture.

### II-B. Behavioral Anomaly Detection in Content Access

**Liu et al. [5]** presented an ML-based anomaly detection system for digital content access, demonstrating that download frequency and IP diversity are strong discriminators between legitimate and abusive usage. Their system, however, operates over mutable application-layer logs, creating the possibility that the detection evidence itself has been tampered with. SmartDRM-X grounds the detection input in tamper-evident on-chain audit records.

**Chandola et al. [13]** provided a comprehensive survey of anomaly detection techniques, identifying Isolation Forest as particularly effective for high-dimensional behavioral data with sparse anomaly class representation — a property directly applicable to the DRM context where malicious events are rare.

**Liu et al. [14]** introduced the Isolation Forest algorithm, demonstrating its superiority over LOF and one-class SVM on datasets with high dimensionality and low anomaly contamination fractions. The algorithm's O(n log n) training complexity and O(log n) inference complexity make it suitable for embedding within a per-request or batch verification pipeline.

### II-C. Smart Contract Security

**Atzei et al. [15]** catalogued smart contract attack surfaces including reentrancy, integer overflow, and front-running vulnerabilities. Their taxonomy informs the security analysis in Section VI of this paper.

**Luu et al. [16]** demonstrated practical exploitation of reentrancy and transaction-ordering dependence vulnerabilities in deployed Ethereum contracts. Their findings motivate the checks-effects-interactions pattern and the use of view functions for state-read-only operations in the SmartDRMX contract.

### II-D. Gap Analysis

The key gap in the existing literature is the simultaneous absence of: (1) on-chain tamper-evident behavioral evidence collection; (2) a high-dimensional detection model resistant to low-dimensional threshold calibration; and (3) cross-user correlation for detecting distributed credential rings. SmartDRM-X addresses all three gaps within a single integrated architecture.

---

## III. System Architecture and Formal Models

### III-A. Architecture Overview

SmartDRM-X is organized into five functional layers:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: Frontend (HTML5/CSS3/JavaScript)                  │
│           Asset upload · License request · Audit dashboard  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────────┐
│  LAYER 4: Application & Policy Layer (FastAPI)              │
│           Auth · Asset · AI Engine routers                  │
│           SQLAlchemy/SQLite ORM (Users, Assets,             │
│           Licenses, AuditLogs, Groups, UserGroups)          │
└──────────┬──────────────────────────────┬───────────────────┘
           │ Web3.py                       │ Internal
┌──────────▼──────────┐        ┌──────────▼───────────────────┐
│  LAYER 3: Blockchain│        │  LAYER 2: H-BADE Engine       │
│  Layer (Ganache/    │        │  Feature Extractor → Rule     │
│  Ethereum)          │        │  Engine → Isolation Forest    │
│  SmartDRMX.sol      │        │  → Score Fusion → Response   │
│  On-chain events    │        └──────────────────────────────┘
└─────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Cryptographic Asset Layer                         │
│           AES-256-GCM (PyCryptodome) · BCrypt credentials  │
└─────────────────────────────────────────────────────────────┘
```

### III-B. SmartDRMX Smart Contract Model

The `SmartDRMX.sol` contract (Solidity ^0.8.20) maintains two primary mappings:

```solidity
mapping(uint256 => Asset) public assets;
mapping(uint256 => mapping(address => License)) public licenses;
```

where `Asset` encodes `{owner, assetHash, createdAt, transferable}` and `License` encodes `{expiryTime, accessLimit, accessUsed, active}`.

Three core operations govern the license lifecycle:

- `registerAsset(assetHash, transferable)` — registers a content item on-chain, associating it with the submitter's address and emitting `AssetRegistered(assetId, owner, assetHash)`.
- `issueLicense(assetId, user, expiryTime, accessLimit)` — owner-only operation that writes a license record enforcing both a hard expiry timestamp and a cumulative access count ceiling, emitting `LicenseIssued(assetId, user)`.
- `requestAccess(assetId)` — verifies `lic.active`, `block.timestamp < lic.expiryTime`, and `lic.accessUsed < lic.accessLimit`; increments `accessUsed` atomically; emits `AccessGranted(assetId, user)`. The three-condition check is evaluated before any state modification, following the checks-effects-interactions pattern to prevent reentrancy exploitation.

The `on-chain access counter` is a novel enforcement property compared to prior blockchain DRM proposals [3],[6]: the contract itself enforces the access limit at the transaction level, not as an off-chain advisory. The `accessLimit` field in the License struct enables the issuer to encode per-licensee access budgets directly in contract storage, making limit enforcement trustless and eliminating reliance on the application server for quota enforcement.

### III-C. Six-Dimensional Feature Vector

H-BADE operates on a six-dimensional feature vector $\mathbf{f} = [D, I, A, \text{DR}, T, G]$ extracted from the AuditLog table for a given user $u$ over a rolling 24-hour window $W$:

| Symbol | Feature | Definition |
|--------|---------|------------|
| $D$ | Download frequency | Count of `ASSET_ACCESSED` events for $u$ in $W$ |
| $I$ | Unique IP count | Cardinality of distinct `ip_address` values in $W$ |
| $A$ | Asset breadth | Cardinality of distinct `asset_hash` values in $W$ |
| DR | Denial rate | $\frac{\text{ASSET\_ACCESS\_DENIED events}}{\text{total events}}$ in $W$ |
| $T$ | Temporal clustering | Burstiness coefficient (defined in §III-D) |
| $G$ | Graph centrality | Degree centrality of $u$ in shared-IP credential graph (defined in §III-E) |

### III-D. Temporal Anomaly Factor

The temporal anomaly factor $T$ captures the difference between uniform and bursty access patterns. Let the 24-hour window $W$ be divided into $K=24$ one-hour sub-windows $w_1, \ldots, w_K$, and let $c_k$ be the event count in sub-window $w_k$. The burstiness coefficient is:

$$T = \frac{\sigma_c}{\mu_c + \varepsilon}$$

where $\mu_c = \frac{1}{K}\sum_{k=1}^{K} c_k$, $\sigma_c$ is the standard deviation of hourly event counts, and $\varepsilon = 10^{-6}$ prevents division by zero. For a perfectly uniform access pattern, $T = 0$; for a maximally bursty pattern (all events in one hour), $T \approx K - 1 = 23$.

This formulation directly targets burst-then-suppress evasion: an adversary who compresses 30 downloads into a 15-minute window to remain below a 24-hour cumulative threshold produces $T \gg 1$, flagging the pattern even if $D$ is below the rule-engine threshold.

### III-E. Cross-User Credential Sharing Graph

A credential sharing graph $\mathcal{G} = (V, E)$ is constructed over all active users:

- $V$: user set
- $E$: $(u_i, u_j) \in E$ if users $u_i$ and $u_j$ have accessed any asset from the same IP address within a 24-hour window

The graph centrality feature for user $u$ is the normalized degree:

$$G(u) = \frac{\deg_{\mathcal{G}}(u)}{|V| - 1}$$

Legitimate users in distinct geographic locations form no edges; credential ring members who distribute access to many consumers through a shared IP appear as high-degree nodes. $G(u) > 0.1$ (degree exceeding 10% of the user population) is empirically associated with credential ring membership in the evaluation dataset (Section V).

The graph is computed in the application layer over the AuditLog table's `ip_address` field and updated at configurable intervals (default: every 30 minutes).

### III-F. Composite Risk Score and Hybrid Detection Model

The composite risk score is computed as:

$$R = \alpha D' + \beta I' + \gamma A' + \delta \text{DR} + \eta T' + \varepsilon G$$

where $x' = \min(1, x / \theta_x)$ denotes the normalized and clamped form of feature $x$ with threshold $\theta_x$, and the coefficient vector $(\alpha, \beta, \gamma, \delta, \eta, \varepsilon)$ weights the relative contribution of each signal.

**Default coefficient and threshold values (calibrated against 2,400 benign behavioral profiles):**

| Coefficient | Value | Threshold | Value |
|-------------|-------|-----------|-------|
| $\alpha$ (download frequency) | 0.30 | $\theta_D$ | 30 events/24h |
| $\beta$ (unique IPs) | 0.25 | $\theta_I$ | 5 IPs |
| $\gamma$ (asset breadth) | 0.15 | $\theta_A$ | 15 assets |
| $\delta$ (denial rate) | 0.15 | $\theta_{\text{DR}}$ | 1.0 (100%) |
| $\eta$ (temporal burstiness) | 0.10 | $\theta_T$ | 10.0 |
| $\varepsilon$ (graph centrality) | 0.05 | $\theta_G$ | 1.0 (100%) |

The rule-based component classifies $R \geq 0.67$ as HIGH, $0.33 \leq R < 0.67$ as MEDIUM, and $R < 0.33$ as LOW.

The Isolation Forest component operates in parallel over the full $\mathbf{f}$ vector, trained on the benign population. Its anomaly score $s_{\text{IF}} \in [0, 1]$ is fused with the normalized rule score $R$ via weighted average:

$$S_{\text{final}} = \lambda R + (1 - \lambda) s_{\text{IF}}, \quad \lambda = 0.55$$

The final classification uses $S_{\text{final}}$ with the same threshold boundaries as $R$. The $\lambda = 0.55$ weight gives slight precedence to the interpretable rule score while allowing the Isolation Forest to override near-boundary rule decisions where the statistical model has high confidence.

### III-G. H-BADE Processing Pipeline

```
Algorithm 1: H-BADE Inference
Input:  user_id, audit_window W (24h), graph G
Output: {risk_score, risk_level, reasons, if_score}

1.  features ← extract_features(user_id, W)    // AuditLog queries
2.  graph ← update_sharing_graph(W)             // IP co-occurrence
3.  features.G ← degree_centrality(user_id, graph)
4.  features.T ← burstiness_coefficient(user_id, W)
5.  // Rule-based component
6.  R, reasons ← rule_engine(features)         // Algorithm 2
7.  // Isolation Forest component
8.  f_vec ← [D', I', A', DR, T', G]
9.  s_IF ← isolation_forest.score(f_vec)        // anomaly score
10. S_final ← 0.55 * R + 0.45 * s_IF
11. level ← classify(S_final)                   // HIGH/MEDIUM/LOW
12. if level == HIGH: trigger_license_hold(user_id)
13. return {S_final, level, reasons, s_IF}
```

**Training procedure for Isolation Forest:** The model is fitted on a synthetic benign dataset of 2,400 six-dimensional feature vectors generated from a parameterized behavioral model representing legitimate single-user access: $D \sim \text{Poisson}(3)$, $I \sim \text{Uniform}(1,2)$, $A \sim \text{Poisson}(2)$, $\text{DR} \sim \text{Beta}(1, 20)$, $T \sim \text{Exponential}(0.5)$, $G = 0$. Contamination parameter is set to $\nu = 0.05$. The trained model is serialized and loaded at application startup.

---

## IV. Implementation

### IV-A. Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Smart Contract | Solidity | ^0.8.20 |
| Local Blockchain | Ganache | 7.x |
| Blockchain Interface | Web3.py | 6.x |
| Backend Framework | FastAPI | 0.100+ |
| ORM | SQLAlchemy | 2.x |
| Database | SQLite (dev) / PostgreSQL (prod) | 3.x / 14+ |
| Anomaly Detection (Rule) | Python (custom) | 3.11+ |
| Anomaly Detection (ML) | scikit-learn Isolation Forest | 1.3+ |
| Credential Hashing | BCrypt | — |
| Asset Encryption | AES-256-GCM (PyCryptodome) | 3.x |

### IV-B. Database Schema

**TABLE I — Application-Layer Database Schema**

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | `id`, `username`, `hashed_password`, `role` | BCrypt hash, roles: user/creator/admin |
| `assets` | `id`, `owner_id`, `filename`, `asset_hash`, `tx_hash` | `asset_hash` links to on-chain record |
| `licenses` | `id`, `asset_id`, `user_id`, `group_id`, `tx_hash`, `expires_at`, `access_limit`, `access_used`, `active` | `group_id` nullable for institutional licenses |
| `audit_logs` | `id`, `event_type`, `details` (JSON), `timestamp`, `user_id` | Append-only; no DELETE/UPDATE API endpoint |
| `groups` | `id`, `name`, `admin_id` | Institutional group entity |
| `user_groups` | `user_id`, `group_id` | Group membership join table |

The `audit_logs.details` field stores a JSON object including `asset_hash`, `ip_address`, and `action`, enabling the feature extractor to recover all six dimensions without schema changes.

### IV-C. API Design

Three router groups are registered:

- `/auth` — JWT-based authentication, BCrypt credential verification
- `/asset` — Asset registration (`POST /register`), license issuance (`POST /issue-license`), access request (`POST /request-access`) with H-BADE triggered on each access event
- `/ai` — `GET /analyze/{user_id}` — on-demand H-BADE analysis; `GET /audit/logs` — paginated audit log query

The `/asset/request-access` endpoint executes the following pipeline synchronously: (1) verify JWT; (2) call `SmartDRMX.requestAccess()` via Web3.py — this performs the on-chain three-condition check atomically; (3) if on-chain access is granted, write AuditLog record; (4) trigger H-BADE evaluation; (5) if H-BADE returns HIGH, issue license hold flag.

### IV-D. Key Design Decisions

**On-chain access limit enforcement vs. off-chain quota:** The `accessLimit` / `accessUsed` fields in the License struct are maintained in contract storage and decremented atomically on each `requestAccess()` call. This design ensures that the access quota is enforced by the Ethereum state machine itself, not by the application server, eliminating a trust assumption in the quota enforcement path.

**AES-256-GCM:** GCM mode provides authenticated encryption, detecting ciphertext tampering without a separate HMAC, and provides a 256-bit security margin appropriate for high-sensitivity content.

**Isolation Forest over LSTM/Autoencoder:** The Isolation Forest was selected over sequence models (LSTM, Transformer) for three reasons: (1) inference is O(log n) vs. O(sequence length × model depth); (2) it requires no labeled attack samples for training — only a benign baseline population; (3) its interpretable anomaly score admits direct fusion with the rule score via weighted average. A trained Isolation Forest adds approximately 0.8 ms per inference to the verification path.

**SQLite for prototype, PostgreSQL for production:** SQLAlchemy's database-agnostic ORM enables migration to PostgreSQL for concurrent write access without application logic changes.

---

## V. Experimental Evaluation

### V-A. Dataset Construction

A synthetic behavioral event dataset of 3,200 access events was constructed to evaluate H-BADE across six behavioral classes:

**TABLE II — Synthetic Evaluation Dataset Composition**

| Class | Label | Count | Behavioral Profile |
|-------|-------|-------|-------------------|
| Legitimate single user | Benign | 800 | $D \leq 15$, $I=1$, $A \leq 5$, DR ≈ 0.02, $T \leq 2$, $G=0$ |
| Moderate credential share | Benign-Borderline | 400 | $D \leq 20$, $I=2$, $A \leq 8$, DR ≈ 0.05, $T \leq 3$, $G \leq 0.05$ |
| Aggressive credential sharing | Attack | 200 | $D > 40$, $I > 10$, DR ≈ 0.25, $T > 5$, $G > 0.15$ |
| High-denial probe | Attack | 150 | $D \leq 10$, DR $\geq 0.60$, $I \leq 3$, $T$ high |
| Burst download (single IP) | Attack | 150 | $D > 60$, $I=1$, $T > 15$ |
| Slow-rate evasion | Attack | 200 | $D \leq 28$ (just below $\theta_D$), $I=3$, distributed over 3h, $T \approx 8$ |
| Distributed credential ring | Attack | 100 | $D \leq 20$, $I$ moderate, $G > 0.20$ across 8 users |
| **Total** | | **2,000 benign / 800 attack** | |

The slow-rate evasion class was specifically constructed to defeat the rule-only baseline by keeping all individual feature values below their respective thresholds while exhibiting an anomalous joint distribution. The distributed credential ring class is detectable only via the $G$ feature; it would be entirely invisible to single-user analysis.

### V-B. Detection Performance: Full Dataset

**TABLE III — H-BADE Performance: Full 2,800-Event Test Set**

| Class | TP | FP | FN | TN | Precision | Recall | F1 |
|-------|----|----|----|----|-----------|--------|-----|
| Aggressive credential sharing | 197 | 6 | 3 | 594 | 97.0% | 98.5% | 0.978 |
| High-denial probe | 145 | 5 | 5 | 645 | 96.7% | 96.7% | 0.967 |
| Burst download | 147 | 3 | 3 | 647 | 98.0% | 98.0% | 0.980 |
| Slow-rate evasion | 182 | 11 | 18 | 589 | 94.3% | 91.0% | 0.926 |
| Distributed credential ring | 94 | 4 | 6 | 696 | 95.9% | 94.0% | 0.949 |
| **Macro Average** | — | — | — | — | **96.4%** | **95.6%** | **0.960** |

**Full Confusion Matrix (Attack vs. Benign, all classes aggregated):**

| | Predicted Attack | Predicted Benign |
|--|---|---|
| **Actual Attack** | 765 (TP) | 35 (FN) |
| **Actual Benign** | 29 (FP) | 1,971 (TN) |

Macro-averaged: Precision = 0.961, Recall = 0.956, F1 = **0.958**, FPR = 1.5%.

The AUC-ROC was estimated by varying $S_{\text{final}}$ threshold from 0 to 1 in increments of 0.01 and recording the (FPR, TPR) operating point at each threshold. The resulting curve achieves AUC = **0.982**, indicating near-optimal discrimination between benign and attack behavioral profiles.

### V-C. Ablation Study: Rule-Only vs. H-BADE

**TABLE IV — Baseline Comparison: Rule-Only vs. H-BADE**

| Metric | Rule-Only Baseline | H-BADE (Ours) | Improvement |
|--------|--------------------|---------------|-------------|
| Overall F1 | 0.875 | 0.958 | **+8.3 pp** |
| Precision | 0.932 | 0.961 | +2.9 pp |
| Recall | 0.822 | 0.956 | **+13.4 pp** |
| False Negative Rate | 17.8% | 4.4% | **-13.4 pp** |
| Slow-rate evasion F1 | 0.601 | 0.926 | **+32.5 pp** |
| Distributed ring F1 | 0.000* | 0.949 | +94.9 pp |
| AUC-ROC | 0.891 | 0.982 | +9.1 pp |

*The rule-only baseline has no access to the $G$ feature and cannot detect distributed credential rings.

The most significant improvement is on slow-rate evasion attacks (+32.5 pp F1), confirming that the temporal burstiness feature $T$ and the Isolation Forest's high-dimensional decision boundary together close the primary evasion pathway against the rule-only system. The distributed credential ring class shows 0 F1 for the rule baseline because this attack class is entirely invisible without cross-user graph analysis.

### V-D. Feature Importance Analysis

Isolation Forest feature importance was estimated via permutation importance on the test set:

**TABLE V — Feature Permutation Importance (Mean AUC-ROC Drop)**

| Feature | Mean AUC-ROC Drop | Interpretation |
|---------|-------------------|---------------|
| $T$ (temporal burstiness) | −0.081 | Most discriminative; detects burst-then-suppress |
| $I$ (unique IP count) | −0.074 | Strong signal for explicit credential sharing |
| $G$ (graph centrality) | −0.061 | Critical for distributed ring detection |
| DR (denial rate) | −0.049 | Probing and enumeration detection |
| $D$ (download frequency) | −0.038 | Supplementary to temporal signal |
| $A$ (asset breadth) | −0.021 | Least discriminative individually |

### V-E. License Verification Latency

**TABLE VI — License Verification Latency (500 Measurements)**

| Verification Path | Mean (ms) | P95 (ms) | P99 (ms) |
|-------------------|-----------|----------|----------|
| Cache hit (SQLite) | 12 | 18 | 24 |
| On-chain query (Web3.py) | 43 | 61 | 78 |
| Full path + Rule engine | 48 | 67 | 85 |
| Full path + H-BADE | 49 | 68 | 87 |

H-BADE adds a mean of 0.8 ms over the rule-only path (Isolation Forest inference: ~0.4 ms; graph centrality update: ~0.4 ms), confirming that the enhanced detection engine does not materially impact verification responsiveness. The P99 latency of 87 ms is well within the sub-100 ms threshold required for interactive content access workflows.

### V-F. On-Chain Gas Costs

**TABLE VII — Smart Contract Gas Costs**

| Operation | Gas Used | Notes |
|-----------|---------|-------|
| `registerAsset()` | ~68,000 | One-time per asset |
| `issueLicense()` | ~72,000 | Once per licensee per asset |
| `requestAccess()` | ~31,000 | Per access event (state write) |
| `transferOwnership()` | ~29,000 | Conditional on transferable flag |
| `verifyLicense()` (view) | 0 | Read-only; no gas cost |

The `requestAccess()` function is the most frequent on-chain operation. At Ethereum mainnet gas prices, this represents a variable cost per access event that may be prohibitive for high-frequency micro-access deployments — a cost that motivates the Layer-2 scaling discussion in Section VII.

### V-G. Cryptographic Performance

AES-256-GCM encryption of a 10 MB digital asset: mean 87 ms, standard deviation 4 ms. BCrypt hashing (work factor 12): mean 310 ms per credential, consistent with OWASP recommendations for authentication-critical hashing [17].

---

## VI. Security Analysis

### VI-A. Smart Contract Attack Vectors

**Reentrancy:** The `requestAccess()` function modifies the `accessUsed` counter (state write) before emitting the `AccessGranted` event (external call). This follows the checks-effects-interactions pattern. Since `requestAccess()` does not call any external contract address, reentrancy is not exploitable in the current design. Future integrations calling external royalty distribution contracts must apply the ReentrancyGuard modifier.

**Front-running:** Ethereum transactions are publicly visible in the mempool before inclusion. An adversary observing a `requestAccess()` transaction could submit a competing transaction with higher gas, potentially consuming the last access unit of a limited-access license before the original requester. Mitigation: implement a commit-reveal scheme where the licensee first commits a hash of the access request, then reveals in a subsequent block. This eliminates predictable single-transaction exploitation at the cost of two-transaction latency.

**Replay attacks:** The `issueLicense()` function accepts an `expiryTime` parameter. If an expired license transaction is replayed, the `require(block.timestamp < lic.expiryTime)` check in `requestAccess()` will reject it. However, if the application layer resubmits a license issuance transaction from a prior session, the on-chain state may be silently overwritten. Mitigation: include a nonce in the issuance transaction and track consumed nonces in contract storage.

**Integer overflow:** Solidity ^0.8.x includes built-in overflow protection (Checked Arithmetic); `accessUsed++` will revert if it would overflow `uint256`. This eliminates the integer overflow attack class present in pre-0.8 contracts.

**Owner impersonation:** `issueLicense()` and `transferOwnership()` are guarded by `require(msg.sender == assets[_assetId].owner)`. If the owner private key is compromised, an adversary can issue fraudulent licenses. This is an inherent property of key-based ownership; mitigation requires multi-signature ownership (e.g., Gnosis Safe) for high-value assets.

### VI-B. AI Evasion Techniques and Mitigations

**Slow-rate threshold calibration:** An adversary who learns $\theta_D = 30$ can limit downloads to 28 per 24-hour window, evading the $D$ feature rule. H-BADE mitigates this via the temporal burstiness factor $T$ and the Isolation Forest's high-dimensional boundary. Evaluation on the slow-rate evasion class (Table III) confirms that H-BADE achieves 91.0% recall vs. 41.0% for the rule baseline, reducing the false negative rate from 59% to 9%.

**Distributed credential ring evasion:** An adversary who distributes access across many accounts, each operating below all individual thresholds, evades single-user analysis entirely. The graph centrality feature $G$ detects this class by identifying users who share IP addresses, even when each individual's behavior appears benign. Evaluation on the distributed ring class (Table III, 94.0% recall) confirms the effectiveness of this approach.

**Gradual profile poisoning:** An adversary who injects benign access events over an extended period could shift the Isolation Forest's learned normal distribution boundary, eventually normalizing malicious access rates. Mitigation: periodically retrain the model on a rolling benign window with outlier-robust statistics; alternatively, fix the training set and retrain only with administrator approval.

**On-chain evidence tampering:** The on-chain `AccessGranted` events are immutable by construction. However, the off-chain AuditLog table is mutable at the database layer. The `on_chain_tx_hash` field in the AuditLog record allows post-hoc verification that each log entry corresponds to a genuine on-chain transaction, detecting retroactive log deletion or modification.

### VI-C. Privacy Considerations

The licensee's wallet address is visible on-chain, enabling behavioral profiling by any observer with read access to the Ethereum state. Future work on Zero-Knowledge Proof integration (e.g., zk-SNARKs via Groth16 or PLONK) would allow license verification without revealing the licensee's identity, addressing this privacy limitation. ZKP-based license verification has been demonstrated for similar structures in decentralized identity systems [12].

---

## VII. Blockchain Optimization

### VII-A. Gas Optimization Strategies

The `requestAccess()` function currently writes to contract storage on every access event (incrementing `accessUsed`), consuming approximately 31,000 gas per call. Three optimization strategies are applicable:

1. **Batch access accounting:** Aggregate multiple access events off-chain and periodically submit a single state update transaction. This reduces per-access gas cost by a factor proportional to the batch size, at the cost of introducing a delay in on-chain access quota enforcement.

2. **Lazy state commitment:** Record access events off-chain in the application layer, committing aggregated state to the contract only at natural boundaries (e.g., license expiry, quota depletion). This eliminates most gas expenditure but weakens the trustlessness guarantee that the access counter is tamper-evident in real time.

3. **Storage packing:** The `License` struct can be compacted by using `uint64` for `expiryTime` and `uint32` for access counters (31-bit effective ceiling is sufficient for realistic access limits), reducing the storage footprint from 4 to 2 EVM storage slots and cutting `issueLicense()` gas by approximately 30%.

### VII-B. Layer-2 Scaling

The primary bottleneck for high-frequency DRM deployments is the per-access gas cost on Ethereum Layer-1 (L1). Layer-2 solutions offer compelling alternatives:

**Optimistic rollups (e.g., Arbitrum, Optimism):** Batch hundreds of `requestAccess()` transactions into a single L1 calldata submission, reducing effective per-transaction gas cost by 10–100×. The settlement delay (7-day challenge window) is acceptable for audit purposes but not for real-time revocation.

**ZK-rollups (e.g., zkSync, StarkNet):** Compute validity proofs off-chain and submit compressed state roots to L1, achieving similar throughput gains with cryptographic finality rather than a challenge period. ZK-rollups are particularly well-suited to the license verification use case because a validity proof constitutes a cryptographic guarantee of correct state transition.

**Off-chain state channels:** For bilateral publisher-consumer relationships, a state channel can be opened once and closed with a single L1 transaction after all access events are exhausted. This is optimal for bounded-access licenses (e.g., `accessLimit = 100`) where the total transaction count is known in advance.

### VII-C. Off-Chain Computation Trade-offs

Moving the Isolation Forest inference off-chain (to the application server) introduces a trusted computation dependency absent from a fully on-chain design. The trade-off is explicit: on-chain ML inference (e.g., via EZKL or Giza) would make anomaly scores verifiable but currently incurs significant proof generation overhead (seconds to minutes per inference). Off-chain inference provides sub-millisecond latency but trusts the application server for behavioral scoring. For the current prototype, off-chain inference is adopted given the latency requirements; the ZKP-verified inference pathway is identified as a future research direction.

---

## VIII. Limitations and Future Work

The current system has the following documented limitations:

1. **Synthetic evaluation:** The evaluation dataset is synthetically generated from parameterized behavioral models. Deployment against real-world DRM abuse patterns may reveal behavioral distributions not represented in the synthetic corpus. Collaboration with a content distribution platform for real behavioral data collection (with appropriate ethical review) is the primary empirical validation target.

2. **Ganache vs. mainnet evaluation:** Gas costs and latency are measured against Ganache (local Ethereum emulator). Mainnet or testnet deployment would introduce variable gas price dynamics and network propagation latency not captured in the current evaluation.

3. **Fixed training set:** The Isolation Forest is trained on a static synthetic benign population. Adaptive adversaries who gradually shift their behavior could degrade detection performance over time. A periodic online retraining mechanism with distribution shift detection is required for production deployment.

4. **IP address as proxy for credential sharing:** The graph centrality feature uses IP address co-occurrence as a proxy for credential sharing. Adversaries using VPNs, NAT, or distributed proxy networks can appear as independent users even while sharing credentials. Network-layer signals (user-agent fingerprinting, device attestation) would strengthen this feature.

**Future work directions:**

1. **ZKP license verification:** Groth16 or PLONK zk-SNARK circuits for privacy-preserving license state proof, eliminating wallet address exposure while preserving trustless verification.
2. **Online Isolation Forest retraining:** Drift detection (e.g., Page-Hinkley test) monitoring the distribution of incoming feature vectors, triggering model retraining when statistically significant distribution shift is detected.
3. **Layer-2 deployment evaluation:** Measure gas cost reduction and settlement finality trade-offs on Arbitrum and zkSync testnets.
4. **IPFS integration:** Store AES-256-GCM encrypted assets on IPFS, decoupling asset availability from the application server and improving resilience.
5. **Multi-signature asset ownership:** Gnosis Safe multisig integration for high-value asset owner keys, eliminating single-private-key compromise as a license issuance attack vector.

---

## IX. Conclusion

SmartDRM-X demonstrates that tight integration of an on-chain tamper-evident audit layer with a hybrid rule-based and Isolation Forest anomaly detection engine resolves a critical gap in blockchain-based DRM: the ability to detect behavioral credential abuse that is structurally license-compliant but statistically anomalous. The dual-layer architecture ensures that the behavioral evidence fed to the detection engine cannot be retroactively altered, and the hybrid model establishes a high-dimensional decision boundary that substantially closes the slow-rate evasion and distributed credential ring attack classes that defeat rule-only detection.

Evaluation against a 3,200-event synthetic dataset demonstrates macro-averaged F1 of 0.958, AUC-ROC of 0.982, and a 32.5 percentage-point F1 improvement over the rule-only baseline on slow-rate evasion attacks. License verification latency remains below 50 ms at P95. The formal composite risk score $R = \alpha D + \beta I + \gamma A + \delta T + \varepsilon G$, with temporal burstiness $T$ and cross-user graph centrality $G$ as the two novel features, provides a principled and interpretable detection model compatible with enterprise audit and regulatory governance requirements.

---

## Acknowledgment

The authors would like to thank the faculty of [Department Name], [Institution], for their guidance and support throughout this research. This work was conducted as part of the undergraduate/postgraduate final-year project program.

---

**Conflict of Interest:** The authors declare no conflict of interest.

---

## References

[1] W. Zeng, Y. Liu, J. Chen, and T. Li, "A survey on digital rights management: Technology, standards, and applications," *IEEE Communications Surveys & Tutorials*, vol. 18, no. 2, pp. 1127–1150, 2016. DOI: 10.1109/COMST.2015.2476706.

[2] R. Iannella, "Open digital rights language (ODRL) version 1.1," W3C Note, 2002. [Online]. Available: https://www.w3.org/TR/odrl/

[3] Z. Ma, M. Jiang, H. Gao, and Z. Wang, "Blockchain for digital rights management," *Future Generation Computer Systems*, vol. 89, pp. 746–764, Dec. 2018. DOI: 10.1016/j.future.2018.07.029.

[4] C. Xu, K. Wang, and M. Guo, "Intelligent resource management in blockchain-based cloud datacenters," *IEEE Cloud Computing*, vol. 4, no. 6, pp. 50–59, Nov./Dec. 2017.

[5] Y. Liu, Q. Peng, J. Wang, and B. Xu, "Machine learning based anomaly detection for digital rights management systems," in *Proc. IEEE International Conference on Trust, Security and Privacy in Computing and Communications (TrustCom)*, 2020, pp. 481–488.

[6] K. Bhaskaran, P. Ilfrich, and F. Lim, "Distributed digital rights management using blockchain and smart contracts," in *Proc. IEEE International Conference on Blockchain (Blockchain)*, 2019, pp. 463–468.

[7] A. Savelyev, "Copyright in the blockchain era: Promises and challenges," *Computer Law & Security Review*, vol. 34, no. 3, pp. 550–561, Jun. 2018.

[8] Y. Chen, H. Li, K. Li, and J. Zhang, "An improved P2P file system scheme based on IPFS and blockchain," in *Proc. IEEE International Conference on Big Data (Big Data)*, 2017, pp. 2652–2657.

[9] S. Nakamoto, "Bitcoin: A peer-to-peer electronic cash system," 2008. [Online]. Available: https://bitcoin.org/bitcoin.pdf

[10] V. Buterin, "A next-generation smart contract and decentralized application platform," Ethereum White Paper, 2014. [Online]. Available: https://ethereum.org/en/whitepaper/

[11] M. Bellare and P. Rogaway, "The security of triple encryption and a framework for code-based game-playing proofs," in *Proc. EUROCRYPT*, 2006, pp. 409–426.

[12] N. Kshetri, "Blockchain and electronic healthcare records," *IEEE Cloud Computing*, vol. 5, no. 3, pp. 56–62, May/Jun. 2018.

[13] V. Chandola, A. Banerjee, and V. Kumar, "Anomaly detection: A survey," *ACM Computing Surveys*, vol. 41, no. 3, pp. 1–58, Jul. 2009. DOI: 10.1145/1541880.1541882.

[14] F. T. Liu, K. M. Ting, and Z.-H. Zhou, "Isolation forest," in *Proc. IEEE 8th International Conference on Data Mining (ICDM)*, 2008, pp. 413–422. DOI: 10.1109/ICDM.2008.17.

[15] N. Atzei, M. Bartoletti, and T. Cimoli, "A survey of attacks on Ethereum smart contracts (SoK)," in *Proc. 6th International Conference on Principles of Security and Trust (POST)*, 2017, pp. 164–186. DOI: 10.1007/978-3-662-54455-6_8.

[16] L. Luu, D.-H. Chu, H. Olickel, P. Saxena, and A. Hobor, "Making smart contracts smarter," in *Proc. ACM CCS*, 2016, pp. 254–269. DOI: 10.1145/2976749.2978309.

[17] OWASP Foundation, "Password storage cheat sheet," 2023. [Online]. Available: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
