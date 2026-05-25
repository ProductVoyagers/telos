/* Telos Comment Widget — GitHub-backed inline comments */

var TELOS_COMMENTS_CONFIG = {
  owner: '__TELOS_GH_OWNER__',
  repo: '__TELOS_GH_REPO__',
  branch: '__TELOS_GH_BRANCH__',
  token: '__TELOS_GH_TOKEN__'
};

var _tc = { comments: {}, sha: null, pagePath: '', round: 1 };

function initComments(pagePath) {
  _tc.pagePath = pagePath;

  _fetchAllComments().then(function () {
    _tc.round = _tc.comments._meta ? _tc.comments._meta.round || 1 : 1;
    document.querySelectorAll('.telos-comments').forEach(function (el) {
      var rec = el.dataset.rec;
      _renderToggle(el, rec);
    });
    _renderAcceptedFeed();
  });
}

/* ── GitHub API ── */

function _commentsFilePath() {
  return 'comments/' + _tc.pagePath + '.json';
}

function _ghHeaders() {
  return {
    'Authorization': 'Bearer ' + TELOS_COMMENTS_CONFIG.token,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
}

function _fetchAllComments() {
  var url = 'https://api.github.com/repos/' + TELOS_COMMENTS_CONFIG.owner + '/' +
    TELOS_COMMENTS_CONFIG.repo + '/contents/' + _commentsFilePath() +
    '?ref=' + TELOS_COMMENTS_CONFIG.branch;

  return fetch(url, { headers: _ghHeaders() })
    .then(function (res) {
      if (res.status === 404) { _tc.comments = {}; _tc.sha = null; return; }
      return res.json().then(function (data) {
        var decoded = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
        _tc.comments = JSON.parse(decoded);
        _tc.sha = data.sha;
      });
    })
    .catch(function () { _tc.comments = {}; _tc.sha = null; });
}

function _writeAllComments() {
  var url = 'https://api.github.com/repos/' + TELOS_COMMENTS_CONFIG.owner + '/' +
    TELOS_COMMENTS_CONFIG.repo + '/contents/' + _commentsFilePath();

  var json = JSON.stringify(_tc.comments, null, 2);
  var encoded = btoa(unescape(encodeURIComponent(json)));

  var body = {
    message: 'comment: ' + _tc.pagePath,
    content: encoded,
    branch: TELOS_COMMENTS_CONFIG.branch
  };
  if (_tc.sha) body.sha = _tc.sha;

  return fetch(url, { method: 'PUT', headers: _ghHeaders(), body: JSON.stringify(body) })
    .then(function (res) {
      if (res.status === 409) {
        return _fetchAllComments().then(function () { return false; });
      }
      return res.json().then(function (data) {
        if (data.content) _tc.sha = data.content.sha;
        return true;
      });
    })
    .catch(function () { return false; });
}

/* ── Data helpers ── */

function _getRecComments(rec) {
  return _tc.comments[rec] || [];
}

function _openCount(rec) {
  return _getRecComments(rec).filter(function (c) {
    return !c.parent_id && !c.resolved && !c.accepted;
  }).length;
}

function _resolvedCount(rec) {
  return _getRecComments(rec).filter(function (c) {
    return !c.parent_id && c.resolved;
  }).length;
}

function _acceptedCount(rec) {
  return _getRecComments(rec).filter(function (c) {
    return !c.parent_id && c.accepted;
  }).length;
}

function _getAllAccepted() {
  var accepted = [];
  Object.keys(_tc.comments).forEach(function (rec) {
    if (rec === '_meta') return;
    var list = _tc.comments[rec];
    if (!Array.isArray(list)) return;
    list.forEach(function (c) {
      if (c.accepted && !c.parent_id) {
        accepted.push({ rec: rec, comment: c, replies: list.filter(function (r) { return r.parent_id === c.id; }) });
      }
    });
  });
  accepted.sort(function (a, b) { return (a.comment.accepted_at || a.comment.created_at).localeCompare(b.comment.accepted_at || b.comment.created_at); });
  return accepted;
}

/* ── Render: Toggle ── */

function _renderToggle(container, rec) {
  container.innerHTML = '';

  if (rec === 'general') {
    _renderGeneralToggle(container);
    return;
  }

  var open = _openCount(rec);
  var resolved = _resolvedCount(rec);
  var accepted = _acceptedCount(rec);
  var total = open + resolved + accepted;

  var btn = document.createElement('button');
  btn.className = 'tc-toggle';

  if (total > 0) {
    btn.classList.add('has-comments');
    var parts = [];
    if (open > 0) parts.push(open + ' open');
    if (accepted > 0) parts.push(accepted + ' accepted');
    if (resolved > 0) parts.push(resolved + ' resolved');
    btn.innerHTML = '💬 ' + parts.join(', ') + ' <span class="tc-arrow">▾</span>';
  } else {
    btn.innerHTML = '<span class="tc-plus">+</span> Comment';
  }

  btn.onclick = function () { _togglePanel(container, rec, btn); };
  container.appendChild(btn);

  var panel = document.createElement('div');
  panel.className = 'tc-panel';
  container.appendChild(panel);
}

function _renderGeneralToggle(container) {
  var directComments = _getRecComments('general');
  var directOpen = directComments.filter(function (c) { return !c.parent_id && !c.resolved && !c.accepted; }).length;
  var allAccepted = _getAllAccepted();

  var btn = document.createElement('button');
  btn.className = 'tc-toggle';

  if (allAccepted.length > 0 || directOpen > 0) {
    btn.classList.add('has-comments');
    var parts = [];
    if (allAccepted.length > 0) parts.push(allAccepted.length + ' accepted');
    if (directOpen > 0) parts.push(directOpen + ' open');
    btn.innerHTML = '💬 ' + parts.join(', ') + ' <span class="tc-arrow">▾</span>';
  } else {
    btn.innerHTML = '<span class="tc-plus">+</span> Add Expert Feedback';
  }

  btn.onclick = function () { _togglePanel(container, 'general', btn); };
  container.appendChild(btn);

  var panel = document.createElement('div');
  panel.className = 'tc-panel';
  container.appendChild(panel);
}

/* ── Render: Panel ── */

function _togglePanel(container, rec, btn) {
  var panel = container.querySelector('.tc-panel');
  var isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    btn.classList.remove('expanded');
  } else {
    panel.classList.add('open');
    btn.classList.add('expanded');
    if (rec === 'general') {
      _renderGeneralPanel(panel);
    } else {
      _renderPanel(panel, rec);
    }
  }
}

function _renderPanel(panel, rec) {
  panel.innerHTML = '';
  var list = _getRecComments(rec);

  var openComments = list.filter(function (c) { return !c.parent_id && !c.resolved && !c.accepted; });
  var acceptedComments = list.filter(function (c) { return !c.parent_id && c.accepted; });
  var resolvedComments = list.filter(function (c) { return !c.parent_id && c.resolved; });

  // Open comments
  var thread = document.createElement('div');
  thread.className = 'tc-thread';
  if (openComments.length === 0 && acceptedComments.length === 0 && resolvedComments.length === 0) {
    thread.innerHTML = '<div class="tc-empty">No comments yet</div>';
  } else {
    openComments.forEach(function (c) {
      thread.appendChild(_renderComment(c, rec, 'open'));
      _getReplies(list, c.id).forEach(function (r) {
        var el = _renderComment(r, rec, 'open');
        el.classList.add('tc-reply');
        thread.appendChild(el);
      });
    });
  }
  panel.appendChild(thread);
  panel.appendChild(_buildForm(rec, null));

  // Accepted — shown inline (read-only), not collapsed
  if (acceptedComments.length > 0) {
    var accSection = document.createElement('div');
    accSection.className = 'tc-accepted-section';

    var accLabel = document.createElement('div');
    accLabel.className = 'tc-section-label tc-section-label-accepted';
    accLabel.textContent = '✓ ' + acceptedComments.length + ' accepted';
    accSection.appendChild(accLabel);

    acceptedComments.forEach(function (c) {
      var threadWrap = document.createElement('div');
      threadWrap.className = 'tc-accepted-inline';
      threadWrap.appendChild(_renderComment(c, rec, 'accepted'));
      _getReplies(list, c.id).forEach(function (r) {
        var el = _renderComment(r, rec, 'accepted');
        el.classList.add('tc-reply');
        threadWrap.appendChild(el);
      });
      accSection.appendChild(threadWrap);
    });

    panel.appendChild(accSection);
  }

  // Resolved
  if (resolvedComments.length > 0) {
    var resSection = _buildCollapsible('— ' + resolvedComments.length + ' resolved', 'tc-resolved-section', function (wrap) {
      resolvedComments.forEach(function (c) {
        wrap.appendChild(_renderComment(c, rec, 'resolved'));
        _getReplies(list, c.id).forEach(function (r) {
          var el = _renderComment(r, rec, 'resolved');
          el.classList.add('tc-reply');
          wrap.appendChild(el);
        });
      });
    });
    panel.appendChild(resSection);
  }
}

function _renderGeneralPanel(panel) {
  panel.innerHTML = '';

  // Accepted knowledge feed — full threads from ALL recs
  var allAccepted = _getAllAccepted();
  if (allAccepted.length > 0) {
    var feedLabel = document.createElement('div');
    feedLabel.className = 'tc-feed-label';
    feedLabel.textContent = 'Accepted Knowledge';
    panel.appendChild(feedLabel);

    allAccepted.forEach(function (item) {
      var threadWrap = document.createElement('div');
      threadWrap.className = 'tc-accepted-thread';

      // Source tag — clickable, scrolls to the recommendation
      if (item.rec !== 'general') {
        var source = document.createElement('a');
        source.className = 'tc-source-tag tc-source-link';
        source.textContent = 'Rec ' + item.rec + ' · Round ' + (item.comment.round || 1);
        source.href = '#rec-' + item.rec;
        source.onclick = function (e) {
          e.preventDefault();
          var target = document.getElementById('rec-' + item.rec);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
        threadWrap.appendChild(source);
      } else {
        var source2 = document.createElement('div');
        source2.className = 'tc-source-tag';
        source2.textContent = 'Expert Feedback · Round ' + (item.comment.round || 1);
        threadWrap.appendChild(source2);
      }

      // Full conversation: parent + all replies (read-only)
      var parent = _renderComment(item.comment, item.rec, 'accepted');
      threadWrap.appendChild(parent);
      item.replies.forEach(function (r) {
        var rel = _renderComment(r, item.rec, 'accepted');
        rel.classList.add('tc-reply');
        threadWrap.appendChild(rel);
      });

      // Accepted badge at bottom
      if (item.comment.accepted_by) {
        var badge = document.createElement('div');
        badge.className = 'tc-accepted-badge';
        badge.textContent = '✓ Accepted by ' + _esc(item.comment.accepted_by);
        threadWrap.appendChild(badge);
      }

      panel.appendChild(threadWrap);
    });
  }

  // Open feedback — new expert input with reply threads
  var directList = _getRecComments('general');
  var openDirect = directList.filter(function (c) { return !c.parent_id && !c.resolved && !c.accepted; });

  var directLabel = document.createElement('div');
  directLabel.className = 'tc-feed-label';
  directLabel.textContent = allAccepted.length > 0 ? 'Open Feedback' : '';
  panel.appendChild(directLabel);

  var thread = document.createElement('div');
  thread.className = 'tc-thread';
  if (openDirect.length === 0 && allAccepted.length === 0) {
    thread.innerHTML = '<div class="tc-empty">Add expert feedback the critique should consider</div>';
  } else {
    openDirect.forEach(function (c) {
      thread.appendChild(_renderComment(c, 'general', 'open'));
      _getReplies(directList, c.id).forEach(function (r) {
        var el = _renderComment(r, 'general', 'open');
        el.classList.add('tc-reply');
        thread.appendChild(el);
      });
    });
  }
  panel.appendChild(thread);
  panel.appendChild(_buildForm('general', null));
}

/* ── Render: Accepted feed (standalone refresh) ── */

function _renderAcceptedFeed() {
  var generalContainer = document.querySelector('.telos-comments[data-rec="general"]');
  if (!generalContainer) return;
  // Toggle already rendered by initComments, nothing extra needed
}

/* ── Render: Comment ── */

function _renderComment(comment, rec, status) {
  var el = document.createElement('div');
  el.className = 'tc-comment';
  if (status === 'resolved') el.classList.add('tc-comment-resolved');
  if (status === 'accepted') el.classList.add('tc-comment-accepted');

  el.innerHTML =
    '<div class="tc-comment-header">' +
      '<span class="tc-author">' + _esc(comment.author) + '</span>' +
      '<span class="tc-time">' + _timeAgo(comment.created_at) + '</span>' +
    '</div>' +
    '<div class="tc-body">' + _esc(comment.body) + '</div>';

  // Accepted = read-only, no buttons at all
  if (status === 'accepted') return el;

  var actions = document.createElement('div');
  actions.className = 'tc-actions';

  // Reply (only on open comments)
  if (status === 'open') {
    var replyBtn = document.createElement('button');
    replyBtn.className = 'tc-reply-btn';
    replyBtn.textContent = 'Reply';
    replyBtn.onclick = function () {
      var existing = el.querySelector('.tc-reply-form');
      if (existing) { existing.remove(); return; }
      document.querySelectorAll('.tc-reply-form').forEach(function (f) { f.remove(); });
      var form = _buildForm(rec, comment.id);
      form.classList.add('tc-reply-form');
      el.appendChild(form);
    };
    actions.appendChild(replyBtn);
  }

  // Accept + Resolve (only on open top-level comments)
  if (!comment.parent_id && status === 'open') {
    var acceptBtn = document.createElement('button');
    acceptBtn.className = 'tc-accept-btn';
    acceptBtn.textContent = 'Accept';
    acceptBtn.onclick = function () { _acceptComment(rec, comment.id, acceptBtn); };
    actions.appendChild(acceptBtn);

    var resolveBtn = document.createElement('button');
    resolveBtn.className = 'tc-resolve-btn';
    resolveBtn.textContent = 'Resolve';
    resolveBtn.onclick = function () { _resolveComment(rec, comment.id, resolveBtn); };
    actions.appendChild(resolveBtn);
  }

  // Resolved badge
  if (!comment.parent_id && status === 'resolved' && comment.resolved_by) {
    var badge = document.createElement('span');
    badge.className = 'tc-resolved-badge';
    badge.textContent = 'Resolved by ' + _esc(comment.resolved_by);
    actions.appendChild(badge);
  }

  el.appendChild(actions);
  return el;
}

/* ── Actions ── */

function _acceptComment(rec, commentId, btn) {
  var name = localStorage.getItem('telos-comment-name') || 'Someone';
  btn.disabled = true;
  btn.textContent = 'Accepting…';

  var list = _getRecComments(rec);
  var comment = list.find(function (c) { return c.id === commentId; });
  if (!comment) return;

  comment.accepted = true;
  comment.accepted_by = name;
  comment.accepted_at = new Date().toISOString();
  comment.round = _tc.round;

  _writeAllComments().then(function (ok) {
    if (!ok) {
      delete comment.accepted;
      delete comment.accepted_by;
      delete comment.accepted_at;
      delete comment.round;
      btn.disabled = false;
      btn.textContent = 'Accept';
      return;
    }
    _refreshAll();
  });
}

function _resolveComment(rec, commentId, btn) {
  var name = localStorage.getItem('telos-comment-name') || 'Someone';
  btn.disabled = true;
  btn.textContent = 'Resolving…';

  var list = _getRecComments(rec);
  var comment = list.find(function (c) { return c.id === commentId; });
  if (!comment) return;

  comment.resolved = true;
  comment.resolved_by = name;

  _writeAllComments().then(function (ok) {
    if (!ok) {
      comment.resolved = false;
      delete comment.resolved_by;
      btn.disabled = false;
      btn.textContent = 'Resolve';
      return;
    }
    _refreshAll();
  });
}

function _refreshAll() {
  document.querySelectorAll('.telos-comments').forEach(function (el) {
    var rec = el.dataset.rec;
    var wasOpen = el.querySelector('.tc-panel.open') !== null;
    _renderToggle(el, rec);
    if (wasOpen) {
      var panel = el.querySelector('.tc-panel');
      panel.classList.add('open');
      el.querySelector('.tc-toggle').classList.add('expanded');
      if (rec === 'general') {
        _renderGeneralPanel(panel);
      } else {
        _renderPanel(panel, rec);
      }
    }
  });
}

/* ── Form ── */

function _buildForm(rec, parentId) {
  var form = document.createElement('div');
  form.className = 'tc-form';

  var savedName = localStorage.getItem('telos-comment-name') || '';

  var nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'tc-name';
  nameInput.placeholder = 'Your name';
  nameInput.value = savedName;

  var textArea = document.createElement('textarea');
  textArea.className = 'tc-text';
  textArea.placeholder = rec === 'general' ? 'Share expert feedback…' : 'Add a comment…';
  textArea.rows = 2;

  var submitBtn = document.createElement('button');
  submitBtn.className = 'tc-submit';
  submitBtn.textContent = 'Submit';
  submitBtn.onclick = function () {
    _submitComment(rec, parentId, nameInput, textArea, submitBtn);
  };

  form.appendChild(nameInput);
  form.appendChild(textArea);
  form.appendChild(submitBtn);
  return form;
}

function _submitComment(rec, parentId, nameInput, textArea, submitBtn) {
  var name = nameInput.value.trim();
  var body = textArea.value.trim();
  if (!name || !body) return;

  localStorage.setItem('telos-comment-name', name);
  submitBtn.disabled = true;
  submitBtn.textContent = 'Posting…';

  var comment = {
    id: crypto.randomUUID(),
    author: name,
    body: body,
    parent_id: parentId,
    round: _tc.round,
    created_at: new Date().toISOString()
  };

  if (!_tc.comments[rec]) _tc.comments[rec] = [];
  _tc.comments[rec].push(comment);

  _writeAllComments().then(function (ok) {
    if (!ok) {
      _tc.comments[rec].pop();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
      var err = document.createElement('div');
      err.className = 'tc-error';
      err.textContent = 'Failed to post. Try again.';
      submitBtn.parentElement.appendChild(err);
      setTimeout(function () { err.remove(); }, 3000);
      return;
    }
    _refreshAll();
  });
}

/* ── Helpers ── */

function _getReplies(list, parentId) {
  return list.filter(function (c) { return c.parent_id === parentId; });
}

function _buildCollapsible(label, className, fillFn) {
  var section = document.createElement('div');
  section.className = className;

  var btn = document.createElement('button');
  btn.className = 'tc-show-collapsed';
  btn.textContent = label;
  btn.onclick = function () {
    var wrap = section.querySelector('.tc-collapsed-wrap');
    var visible = wrap.style.display !== 'none';
    wrap.style.display = visible ? 'none' : 'block';
  };
  section.appendChild(btn);

  var wrap = document.createElement('div');
  wrap.className = 'tc-collapsed-wrap';
  wrap.style.display = 'none';
  fillFn(wrap);
  section.appendChild(wrap);

  return section;
}

function _esc(text) {
  var d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

function _timeAgo(dateStr) {
  var s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  if (s < 604800) return Math.floor(s / 86400) + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}
