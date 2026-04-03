const MOCK_DATA = {
  '/auth/login': {
    code: 200,
    data: {
      token: 'mock-token-' + Date.now(),
      userInfo: {
        id: 1,
        username: 'admin',
        name: '系统管理员',
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
      }
    }
  },
  '/auth/logout': {
    code: 200,
    message: '退出成功'
  },
  '/task/list': {
    code: 200,
    data: {
      list: [
        { id: 1, code: 'TASK_20260116_001', name: '股票信息采集', company: '平安银行', status: 'running', createTime: '2026-01-16 14:20:00' },
        { id: 2, code: 'TASK_20260116_002', name: '股票信息采集', company: '万科A', status: 'completed', createTime: '2026-01-16 14:15:00' },
        { id: 3, code: 'TASK_20260116_003', name: '股票数据录入', company: '浦发银行', status: 'idle', createTime: '2026-01-16 14:10:00' },
        { id: 4, code: 'TASK_20260116_004', name: '股票信息采集', company: '招商银行', status: 'completed', createTime: '2026-01-16 14:05:00' },
        { id: 5, code: 'TASK_20260116_005', name: '股票信息采集', company: '中国平安', status: 'error', createTime: '2026-01-16 14:00:00' }
      ]
    }
  },
  '/stats/overview': {
    code: 200,
    data: {
      tasks: { total: 156, today: 12 },
      robots: { total: 5, online: 4 },
      flows: { total: 8, active: 6 },
      data: { total: 12580, today: 156 },
      status: { running: 8, idle: 15, completed: 120, error: 13 }
    }
  },
  '/system/info': {
    code: 200,
    data: {
      version: 'v1.0.0',
      uptime: '15天 8小时',
      datasource: '东方财富网',
      lastUpdate: '2026-01-16 14:30:00'
    }
  },
  '/system/user/list': {
    code: 200,
    data: {
      list: [
        { id: 1114, username: '1114', name: '1114', email: 'asd@1.com', phone: '14523697896', role: '管理员', status: 'enabled', createTime: '2026-03-24 09:29:11' },
        { id: 1113, username: '1113', name: '1113', email: 'asd@1.com', phone: '13078522587', role: '管理员', status: 'enabled', createTime: '2026-03-24 09:28:33' },
        { id: 1112, username: '1112', name: '111', email: 'asd@1.com', phone: '13514624532', role: '管理员', status: 'enabled', createTime: '2026-03-24 09:27:29' },
        { id: 789123, username: '789123', name: '魏三', email: '271395041@qq.com', phone: '13101392888', role: '管理员', status: 'enabled', createTime: '2026-03-24 09:13:51' },
        { id: 5, username: '上分', name: '上分123', email: '123@qq.com', phone: '18958978524', role: '管理员', status: 'enabled', createTime: '2026-03-23 14:36:24' },
        { id: 6, username: '--', name: '123', email: 'sdada@qq.com', phone: '13652146524', role: '管理员', status: 'enabled', createTime: '2026-03-23 10:30:10' },
        { id: 7, username: '1234', name: '1234', email: '1234567@qq.com', phone: '15023237395', role: '管理员', status: 'enabled', createTime: '2026-03-23 09:32:09' },
        { id: 8, username: '4', name: '4', email: '123456@qq.com', phone: '15023777559', role: '管理员', status: 'enabled', createTime: '2026-03-23 09:30:43' },
        { id: 9, username: '2', name: '2', email: '14652354256@qq.com', phone: '14652354256', role: '管理员', status: 'enabled', createTime: '2026-03-23 09:16:49' },
        { id: 10, username: 'user', name: '用户', email: '123@qq.com', phone: '18716814844', role: '管理员', status: 'enabled', createTime: '2026-03-21 12:34:51' },
        { id: 11, username: 'dev01', name: '开发一', email: 'dev01@example.com', phone: '13800138001', role: '普通用户', status: 'enabled', createTime: '2026-03-20 11:10:03' },
        { id: 12, username: 'dev02', name: '开发二', email: 'dev02@example.com', phone: '13800138002', role: '普通用户', status: 'enabled', createTime: '2026-03-20 11:12:19' },
        { id: 13, username: 'ops01', name: '运维一', email: 'ops01@example.com', phone: '13800138003', role: '运维', status: 'enabled', createTime: '2026-03-19 09:40:25' },
        { id: 14, username: 'ops02', name: '运维二', email: 'ops02@example.com', phone: '13800138004', role: '运维', status: 'disabled', createTime: '2026-03-19 09:42:58' },
        { id: 15, username: 'audit01', name: '审计员', email: 'audit01@example.com', phone: '13800138005', role: '审计', status: 'enabled', createTime: '2026-03-18 18:12:07' },
        { id: 16, username: 'finance01', name: '财务一', email: 'finance01@example.com', phone: '13800138006', role: '财务', status: 'enabled', createTime: '2026-03-18 10:05:44' },
        { id: 17, username: 'finance02', name: '财务二', email: 'finance02@example.com', phone: '13800138007', role: '财务', status: 'disabled', createTime: '2026-03-18 10:06:22' },
        { id: 18, username: 'guest01', name: '访客一', email: 'guest01@example.com', phone: '13800138008', role: '访客', status: 'enabled', createTime: '2026-03-17 16:21:09' },
        { id: 19, username: 'guest02', name: '访客二', email: 'guest02@example.com', phone: '13800138009', role: '访客', status: 'enabled', createTime: '2026-03-17 16:22:31' },
        { id: 20, username: 'test01', name: '测试一', email: 'test01@example.com', phone: '13800138010', role: '测试', status: 'enabled', createTime: '2026-03-16 08:13:55' },
        { id: 21, username: 'test02', name: '测试二', email: 'test02@example.com', phone: '13800138011', role: '测试', status: 'enabled', createTime: '2026-03-16 08:14:20' },
        { id: 22, username: 'pm01', name: '产品一', email: 'pm01@example.com', phone: '13800138012', role: '产品', status: 'enabled', createTime: '2026-03-15 14:55:02' },
        { id: 23, username: 'pm02', name: '产品二', email: 'pm02@example.com', phone: '13800138013', role: '产品', status: 'enabled', createTime: '2026-03-15 14:56:48' },
        { id: 24, username: 'sec01', name: '安全一', email: 'sec01@example.com', phone: '13800138014', role: '安全', status: 'enabled', createTime: '2026-03-14 17:30:00' }
      ]
    }
  },
  '/system/role/list': {
    code: 200,
    data: {
      list: [
        { id: 1, code: 'Greatbd', name: 'GG', description: '有所有权限', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-24 09:29:11' },
        { id: 2, code: 'MANAGER', name: '经理', description: '项目经理', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-24 09:28:33' },
        { id: 3, code: '111', name: '11', description: '11', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-24 09:27:29' },
        { id: 4, code: 'Angle', name: '查看所有', description: '无权限', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-24 09:13:51' },
        { id: 5, code: 'SuperAdmin', name: '超级管理员', description: '无视一切限制，上帝角色', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-23 14:36:24' },
        { id: 6, code: 'www', name: 'ww', description: '无权限', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-23 10:30:10' },
        { id: 7, code: 'ADMIN', name: '系统管理员', description: '拥有所有权限', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-23 09:32:09' },
        { id: 8, code: 'OPERATOR', name: '操作员', description: '可以创建和管理任务', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-23 09:30:43' },
        { id: 9, code: 'VIEWER', name: '查看者', description: '只能查看数据', permission: '无权限', userCount: 0, status: 'enabled', createTime: '2026-03-23 09:16:49' }
      ]
    }
  },
  '/stats/task-chart': {
    code: 200,
    data: {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      taskA: [70, 45, 95, 70, 70, 35, 78, 60, 38, 95, 85],
      taskB: [60, 25, 65, 78, 48, 40, 32, 65, 82, 52, 72],
      total: [48, 60, 52, 58, 45, 30, 62, 75, 55, 65, 45]
    }
  },
  '/client/list': {
    code: 200,
    data: {
      list: [
        { id: 1, name: 'Robot-01', ip: '192.168.1.101', status: 'online', lastHeartbeat: '2026-03-20 09:25:00' },
        { id: 2, name: 'Robot-02', ip: '192.168.1.102', status: 'offline', lastHeartbeat: '2026-03-20 08:00:00' },
        { id: 3, name: 'Robot-03', ip: '192.168.1.103', status: 'online', lastHeartbeat: '2026-03-20 09:26:00' }
      ]
    }
  }
}

export default function mockRequest(url, method = 'get', body = null) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Handle login specifically to simulate validation
      if (url === '/auth/login' && method.toLowerCase() === 'post') {
        const { username, password } = typeof body === 'string' ? JSON.parse(body) : body
        
        if (username === 'locked') {
          resolve({ data: { code: 403, message: '该账号已被锁定，请联系管理员' } })
          return
        }

        if (username === 'admin' && password === 'admin123') {
          resolve({ data: MOCK_DATA['/auth/login'] })
        } else {
          resolve({ data: { code: 401, message: '用户名或密码错误' } })
        }
        return
      }

      if (MOCK_DATA[url]) {
        resolve({ data: MOCK_DATA[url] })
      } else {
        // Default list mock for unknown list urls
        if (url.includes('list')) {
          resolve({ data: { code: 200, data: { list: [] } } })
        } else {
          resolve({ data: { code: 200, data: {} } })
        }
      }
    }, 300)
  })
}
