/**
 * Developer: Kadvin Date: 15/1/26 上午10:41
 */
package dnt.monitor.server.handler.session;

import dnt.monitor.exception.ResourceException;
import dnt.monitor.server.model.EngineOnlineSession;
import dnt.monitor.model.MonitorEngine;
import dnt.monitor.server.service.EngineService;
import net.happyonroad.event.ObjectCreatedEvent;
import net.happyonroad.type.Availability;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * <h1>当监控引擎连上时，设置相应的记录Available</h1>
 */
@Component
class MakeEngineAvailableAfterSessionCreated implements ApplicationListener<ObjectCreatedEvent<EngineOnlineSession>>{
    Logger logger = LoggerFactory.getLogger(getClass());
    @Autowired
    EngineService engineService;

    @Override
    public void onApplicationEvent(ObjectCreatedEvent<EngineOnlineSession> event) {
        EngineOnlineSession session = event.getSource();
        MonitorEngine engine = session.getEngine();
        engine.setAvailability(Availability.Available);
        try {
            engineService.update(engine);
        } catch (ResourceException e) {
            logger.warn("Failed to mark {} available, because of {}", engine, e.getMessage());
        }
    }
}