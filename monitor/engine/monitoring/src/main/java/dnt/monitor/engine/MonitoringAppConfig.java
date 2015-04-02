/**
 * Developer: Kadvin Date: 15/2/16 下午2:27
 */
package dnt.monitor.engine;

import dnt.monitor.engine.service.EngineServiceRegistry;
import dnt.monitor.service.RealtimeService;
import dnt.monitor.service.SynchronizeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * <h1>主动监控模块的应用配置</h1>
 */
@Configuration
@Import(InfrastructureUserConfig.class)
public class MonitoringAppConfig extends DefaultEngineAppConfig {
    @Autowired
    EngineServiceRegistry registry;

    @Override
    protected void beforeExports() {
        super.beforeExports();
        registry.register(SynchronizeService.class, getBean(SynchronizeService.class));
        registry.register(RealtimeService.class, getBean(RealtimeService.class));
    }
}
