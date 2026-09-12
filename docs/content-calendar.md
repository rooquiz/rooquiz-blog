# 内容日历（每周四 10:00 发一篇）

给自动发文任务用的选题清单。任务每周四读 `https://blog.rooquiz.com/sitemap.xml` 去重，
在本表**尚未发布的行**里选一个，按 `automating-publishing.md`
第 3 节的约定写成 1200–1600 词英文 MDX，配一张封面图后 `status: "published"` 写入。

**改这张表就等于改排期**：调顺序、换标题、删掉不想写的行都可以。
`slug` 是去重依据，改了 slug 等于新开一期；已发布的行不要删（删了会被重写一遍）。

标题栏是给写手的方向，不是最终标题——正文生成时可以更锋利，但 slug 必须照抄。

| # | slug | 方向 | 目标关键词 | tags |
|---|------|------|-----------|------|
| 1 | `quiz-funnel-conversion-benchmarks` | 测验漏斗每一环的合理转化率是多少：从曝光到开始、到完成、到留资、到 CTA 点击，给出区间和「低于多少就该查」的判断线 | quiz funnel conversion rate | `analytics` `conversion` |
| 2 | `scored-quiz-vs-scorecard-vs-outcome` | 三种测验形态怎么选：评分测验、维度记分卡、结果型/性格测验各自适合什么目标，用一张决策表说清 | types of online quizzes | `quiz-design` `scoring` |
| 3 | `where-to-put-the-email-gate` | 留资表单放在测验前、测验中还是结果页？三种位置对完成率和线索质量的实际影响 | quiz lead capture | `lead-generation` `conversion` |
| 4 | `radar-chart-report-that-people-read` | 维度雷达图报告怎么设计才有人看完：维度数量、命名、基准线的取法 | assessment report design | `quiz-design` `benchmarks` |
| 5 | `branching-logic-without-a-maze` | 分支逻辑的三种可维护写法，以及什么时候该拆成两个测验而不是加一层分支 | quiz branching logic | `quiz-design` |
| 6 | `inline-vs-popup-embed` | 内联嵌入和弹窗嵌入的取舍：落地页位置、移动端、对完成率的影响，附两段 script 标签示例 | embed quiz on website | `embedding` `conversion` |
| 7 | `five-questions-people-abandon-on` | 最容易导致中途放弃的五类问题，以及每一类的改写示范（改前/改后对照） | quiz abandonment rate | `quiz-design` `conversion` |
| 8 | `lead-scoring-from-quiz-answers` | 用测验答案做线索打分：哪些答案是真实购买信号，怎么映射成分数和标签 | lead scoring | `lead-generation` `scoring` |
| 9 | `quiz-to-crm-in-one-webhook` | 测验线索进 CRM 的最短路径：webhook 载荷结构、Zapier 中转、字段映射的常见坑 | quiz crm integration | `integrations` `lead-generation` |
| 10 | `benchmark-data-as-a-moat` | 攒够样本后，基准数据本身就是产品：怎么在报告里安全地用同行对比 | industry benchmark report | `benchmarks` `analytics` |
| 11 | `hiring-assessment-that-predicts` | 招聘测评怎么设计才真的有预测力：能力维度拆解、题目与岗位的对应、避免的偏差 | pre employment assessment | `use-cases` `scoring` |
| 12 | `quiz-copy-that-sounds-like-them` | 测验文案的第二人称写法：题干、选项、结果标签三层的语气统一 | quiz copywriting | `quiz-design` `conversion` |
| 13 | `question-bank-for-exams-at-scale` | 题库怎么组织才撑得住反复出卷：分类、难度标记、随机抽题与防泄题 | exam question bank | `use-cases` `quiz-design` |
| 14 | `translate-a-quiz-without-breaking-it` | 测验做多语言的实操：哪些内容必须逐条翻、哪些能复用、评分逻辑跨语言怎么保持一致 | multilingual quiz | `localization` `quiz-design` |
| 15 | `result-page-cta-experiments` | 结果页 CTA 的五个可复制实验，以及每个实验需要多少样本才能看出差别 | landing page cta test | `conversion` `analytics` |
| 16 | `funnel-analytics-questions-to-ask` | 拿到漏斗数据后该问的六个问题，附「这个数字异常说明什么」的对照表 | funnel analysis | `analytics` |
| 17 | `personality-quiz-for-b2b` | B2B 也能用性格型测验：把「你是哪种 X」做成有商业含义的分型而不是娱乐 | personality quiz marketing | `use-cases` `lead-generation` |
| 18 | `slack-alerts-for-hot-leads` | 高意向线索实时进 Slack：触发条件怎么定，消息里该放什么才有人真的跟进 | slack lead notification | `integrations` `lead-generation` |
| 19 | `customer-feedback-quiz-vs-nps` | 测评式反馈和 NPS 的差别：什么时候一个分数够用，什么时候需要维度拆解 | customer feedback survey | `use-cases` `benchmarks` |
| 20 | `booking-after-the-result` | 结果页直接约会议：什么样的分型该看到日历、什么样的该看到内容 | book a meeting funnel | `conversion` `use-cases` |
| 21 | `mcp-build-a-quiz-by-chatting` | 用 MCP 让 AI 直接建测验：工具边界、适合交给模型的部分、必须人工确认的部分 | mcp model context protocol | `ai` `integrations` |
| 22 | `ai-generated-questions-quality-bar` | AI 生成题目的质量红线：六条自查规则，以及哪类题目仍然必须人写 | ai quiz generator | `ai` `quiz-design` |
| 23 | `quiz-seo-that-actually-ranks` | 测验页面做 SEO：可索引内容从哪来、结构化数据怎么标、避免薄内容判定 | quiz seo | `seo` `analytics` |
| 24 | `first-90-days-of-a-quiz-funnel` | 新测验漏斗上线后 90 天的运营节奏：每一阶段看什么指标、该改什么 | quiz marketing strategy | `conversion` `analytics` |

## 改这张表立刻生效

定时任务绑定了本机，每周四直接从磁盘读这个文件
（见 [`weekly-post-task-prompt.md`](./weekly-post-task-prompt.md)），
不存在需要手动同步的副本。改完保存就行。

任务会先读一次 [`weekly-brief.md`](./weekly-brief.md)（LeadPilot 每周三写），
**在未发布的行里挑简报推荐的那一个**，不一定按顺序取——所以这张表是候选池，
不是严格排期。简报读不到时才退回顺序取。

## 清单用完之后

第 24 期发完，任务会在 feed 里找不到未发布的 slug。届时它不会瞎编选题，
而是发一条通知提醒补表——所以清单见底前记得续上新的行。
