/**
 * Developer: Kadvin Date: 15/1/14 上午9:18
 */
package dnt.monitor.server.handler.engine;

import dnt.monitor.model.GroupNode;
import dnt.monitor.model.ManagedNode;
import dnt.monitor.model.MonitorEngine;
import dnt.monitor.model.ResourceNode;
import dnt.monitor.server.exception.NodeException;
import dnt.monitor.server.service.NodeService;
import net.happyonroad.event.ObjectCreatedEvent;
import net.happyonroad.spring.Bean;
import net.happyonroad.type.State;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContextException;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

/**
 * <h1>监听引擎创建事件， 为其创建基础架构中的管理节点</h1>
 * 对于主动注册的引擎，以及管理员手工创建的引擎，应该为其创建
 * <ol>
 * <li>相应的资源管理节点
 * <li>群组管理节点
 * </ol>
 * 这些管理节点被创建之后，将会由NodeEventProcess创建相应的TopoNode/Map
 */
@Component
class CreateSystemNodesAfterEngineCreated extends Bean
        implements ApplicationListener<ObjectCreatedEvent<MonitorEngine>> {
    @Autowired
    private NodeService nodeService;

    public CreateSystemNodesAfterEngineCreated() {
        setOrder(20);
    }

    @Override
    public void onApplicationEvent(ObjectCreatedEvent<MonitorEngine> event) {
        MonitorEngine engine = event.getSource();
        autoCreateNodesForEngine(engine);
    }

    /**
     * 对于通过界面手工创建的监控引擎，其engine scope，engine node均已经创建
     * 本方法可以兼容这种情况，不会重复创建
     * @param engine 需要创建管理节点的引擎对象
     */
    void autoCreateNodesForEngine(MonitorEngine engine) {
        //为监控引擎创建相应的系统管理节点(systemNode)，如果已经存在，则不用创建(有可能某种情况，先创建system node，再创建引擎)
        GroupNode engineSystemGroupNode = findOrCreateSystemNode(engine);
        //为监控引擎自身创建相应的管理节点
        createEngineNode(engine, engineSystemGroupNode);
    }

    GroupNode findOrCreateSystemNode(MonitorEngine engine) {
        ManagedNode infNode = nodeService.findByPath(ManagedNode.INFRASTRUCTURE_PATH);
        // 兼容手工创建时，引擎资源节点存在对应管理节点的情况
        // 创建 引擎系统 群组，其中存放监控服务器，监控引擎，相关redis/mysql/nginx等自带应用
        GroupNode engineSystemGroupNode;
        try {
            engineSystemGroupNode = (GroupNode) nodeService.findByPath(engine.getSystemPath());
        } catch (IllegalArgumentException e) {
            // Not found exception
            engineSystemGroupNode = new GroupNode();
            engineSystemGroupNode.cascadeCreating();
            engineSystemGroupNode.setPath(engine.getSystemPath());
            if( engine.isDefault() ){
                engineSystemGroupNode.setLabel( "缺省监控系统");
            }else{
                engineSystemGroupNode.setLabel(engine.getLabel() + "系统");
            }
            engineSystemGroupNode.setIcon("monitor_system");
            engineSystemGroupNode.setComment("Auto created system group node for " + engine.getLabel());
            try {
                nodeService.create(infNode, engineSystemGroupNode);
            } catch (NodeException ex) {
                throw new ApplicationContextException("Can't auto create engine group node", ex);
            }
        }
        return engineSystemGroupNode;
    }

    void createEngineNode(MonitorEngine engine, GroupNode engineSystemGroupNode) {
        //在引擎系统中，添加引擎自身这个节点
        String enginePath = engine.getSystemPath() + "/engine";
        ResourceNode engineNode;
        try {
            nodeService.findByPath(enginePath);
        } catch (Exception e) {
            engineNode = new ResourceNode();
            //说明该节点是在创建引擎后被级联自动创建的
            engineNode.cascadeCreating();
            engineNode.setResource(engine);
            engineNode.setPath(enginePath);
            engineNode.setLabel(engine.getLabel());
            engineNode.setIcon("monitor_engine");
            engineNode.setState(State.Running);
            engineNode.setComment("Auto created engine node for " + engine.getLabel());
            try {
                nodeService.create(engineSystemGroupNode, engineNode);
            } catch (NodeException ex) {
                throw new ApplicationContextException("Can't auto create engine node", ex);
            }
        }
    }
}
