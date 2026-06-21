# Review Perspectives and Deep Dive Phases

## Ultra-Thinking Deep Dive

For each phase below, spend maximum cognitive effort. Think step by step. Consider all angles. Question assumptions. Bring all reviews into a synthesis for the user.

### Phase 1: Stakeholder Perspective Analysis

Put yourself in each stakeholder's shoes:

1. **Developer** — How easy is this to understand and modify? Are APIs intuitive? Is debugging straightforward? Can I test this easily?
2. **Operations** — How do I deploy safely? What metrics and logs are available? How do I troubleshoot? What are resource requirements?
3. **End User** — Is the feature intuitive? Are error messages helpful? Is performance acceptable? Does it solve the problem?
4. **Security Team** — What's the attack surface? Compliance requirements? How is data protected? Audit capabilities?
5. **Business** — What's the ROI? Legal/compliance risks? Time-to-market impact? Total cost of ownership?

### Phase 2: Scenario Exploration

Explore edge cases and failure scenarios:

- [ ] **Happy Path**: Normal operation with valid inputs
- [ ] **Invalid Inputs**: Null, empty, malformed data
- [ ] **Boundary Conditions**: Min/max values, empty collections
- [ ] **Concurrent Access**: Race conditions, deadlocks
- [ ] **Scale Testing**: 10x, 100x, 1000x normal load
- [ ] **Network Issues**: Timeouts, partial failures
- [ ] **Resource Exhaustion**: Memory, disk, connections
- [ ] **Security Attacks**: Injection, overflow, DoS
- [ ] **Data Corruption**: Partial writes, inconsistency
- [ ] **Cascading Failures**: Downstream service issues

## Multi-Angle Review Perspectives

### Technical Excellence
- Code craftsmanship evaluation
- Engineering best practices
- Technical documentation quality
- Tooling and automation assessment

### Business Value
- Feature completeness validation
- Performance impact on users
- Cost-benefit analysis
- Time-to-market considerations

### Risk Management
- Security risk assessment
- Operational risk evaluation
- Compliance risk verification
- Technical debt accumulation

### Team Dynamics
- Code review etiquette
- Knowledge sharing effectiveness
- Collaboration patterns
- Mentoring opportunities
